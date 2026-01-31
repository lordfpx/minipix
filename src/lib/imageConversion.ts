import UPNG from "upng-js";

import { applyPaletteMapping, convertGifWithOptions, quantizePalette } from "@/lib/gifEncoder";
import { applyBackground, ensureColorCount, parseHexColor } from "@/lib/imageUtils";

export type OutputFormat = "jpeg" | "png" | "webp" | "gif";
export type OutputFormatSupport = Record<OutputFormat, boolean>;

export type GifDitheringMode = "none" | "floyd-steinberg";

export interface GifConversionOptions {
	colorCount: number;
	dithering: GifDitheringMode;
	preserveAlpha: boolean;
	backgroundColor: string;
	loopCount: number;
}

export interface PngConversionOptions {
	colorCount: number;
	reduceColors: boolean;
	preserveAlpha: boolean;
	backgroundColor: string;
	interlaced: boolean;
}

export type ConversionConfig =
	| { format: "jpeg"; quality: number }
	| { format: "webp"; quality: number }
	| { format: "png"; options: PngConversionOptions }
	| { format: "gif"; options: GifConversionOptions };

export interface BoostSettings {
	exposure: number;
	saturation: number;
	contrast: number;
	brightness: number;
}

interface ConvertImageOptions {
	boost?: BoostSettings;
}

export interface ConversionResult {
	blob: Blob;
	url: string;
	width: number;
	height: number;
}

const mimeMap: Record<Exclude<OutputFormat, "gif" | "png">, string> = {
	jpeg: "image/jpeg",
	webp: "image/webp",
};

const canvasEncodeSupport = new Map<string, boolean>();
const supportsCanvasEncoding = (mimeType: string) => {
	if (typeof document === "undefined") return true;
	const cached = canvasEncodeSupport.get(mimeType);
	if (cached !== undefined) return cached;
	const canvas = document.createElement("canvas");
	const dataUrl = canvas.toDataURL(mimeType);
	const supported = dataUrl.startsWith(`data:${mimeType}`);
	canvasEncodeSupport.set(mimeType, supported);
	return supported;
};

export const getOutputFormatSupport = (): OutputFormatSupport => ({
	jpeg: supportsCanvasEncoding("image/jpeg"),
	webp: supportsCanvasEncoding("image/webp"),
	png: true,
	gif: true,
});

export const getDefaultOutputFormat = (): OutputFormat => {
	const support = getOutputFormatSupport();
	if (support.webp) return "webp";
	if (support.jpeg) return "jpeg";
	if (support.png) return "png";
	return "gif";
};

const supportedInputMimeTypes = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"image/x-icon",
] as const;

const supportedInputExtensions = new Set(["jpeg", "jpg", "png", "gif", "webp", "svg", "ico"]);

const qualityToFloat = (quality: number) => {
	return Math.min(1, Math.max(0, quality / 100));
};

const clampByte = (value: number) => Math.min(255, Math.max(0, value));
const defaultBoost: BoostSettings = {
	exposure: 0,
	saturation: 1,
	contrast: 1,
	brightness: 0,
};

const applyBoost = (
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	boost: BoostSettings = defaultBoost,
) => {
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	const exposureFactor = 2 ** boost.exposure;
	const saturation = boost.saturation;
	const contrast = boost.contrast;
	const brightness = boost.brightness;
	for (let i = 0; i < data.length; i += 4) {
		let r = data[i] * exposureFactor;
		let g = data[i + 1] * exposureFactor;
		let b = data[i + 2] * exposureFactor;

		const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		r = lum + (r - lum) * saturation;
		g = lum + (g - lum) * saturation;
		b = lum + (b - lum) * saturation;

		r = (r - 128) * contrast + 128 + brightness;
		g = (g - 128) * contrast + 128 + brightness;
		b = (b - 128) * contrast + 128 + brightness;

		data[i] = clampByte(r);
		data[i + 1] = clampByte(g);
		data[i + 2] = clampByte(b);
	}
	ctx.putImageData(imageData, 0, 0);
};

const encodeCanvas = (
	canvas: HTMLCanvasElement,
	mimeType: string,
	quality?: number,
): Promise<Blob> =>
	new Promise((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (result) {
					resolve(result);
				} else {
					reject(new Error("Conversion failed."));
				}
			},
			mimeType,
			quality,
		);
	});

const drawOnCanvas = (
	canvas: HTMLCanvasElement,
	image: CanvasImageSource,
	width: number,
	height: number,
) => {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Impossible de dessiner sur le canvas.");
	}
	canvas.width = width;
	canvas.height = height;
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(image, 0, 0, width, height);
	return ctx;
};

const reduceColors = (source: Uint8ClampedArray, targetColors: number, preserveAlpha: boolean) => {
	const palette = quantizePalette(source, targetColors, {
		format: preserveAlpha ? "rgba4444" : "rgb565",
		oneBitAlpha: preserveAlpha ? undefined : true,
		clearAlpha: true,
	});
	const indices = applyPaletteMapping(source, palette, preserveAlpha ? "rgba4444" : "rgb565");
	const result = new Uint8ClampedArray(source.length);
	for (let i = 0; i < indices.length; i++) {
		const paletteColor = palette[indices[i]];
		const dest = i * 4;
		result[dest] = paletteColor[0];
		result[dest + 1] = paletteColor[1];
		result[dest + 2] = paletteColor[2];
		result[dest + 3] =
			preserveAlpha && paletteColor.length > 3
				? paletteColor[3]
				: preserveAlpha
					? source[dest + 3]
					: 255;
	}
	return result;
};

const convertPng = (imageData: ImageData, options: PngConversionOptions): Blob => {
	const data = new Uint8ClampedArray(imageData.data);
	const background = parseHexColor(options.backgroundColor);

	if (!options.preserveAlpha) {
		applyBackground(data, background);
	}

	const shouldReduce = options.reduceColors && options.colorCount < 256;
	const processed = shouldReduce
		? reduceColors(data, ensureColorCount(options.colorCount), options.preserveAlpha)
		: data;

	const frameBuffer = processed.buffer.slice(
		processed.byteOffset,
		processed.byteOffset + processed.byteLength,
	);

	const colorCount = options.reduceColors ? ensureColorCount(options.colorCount) : 0;
	const upngOptions: Record<string, unknown> = {};
	if (options.interlaced) {
		upngOptions.interlace = 1;
	}
	const pngArrayBuffer = UPNG.encode(
		[frameBuffer],
		imageData.width,
		imageData.height,
		colorCount,
		undefined,
		upngOptions,
	);

	return new Blob([pngArrayBuffer], { type: "image/png" });
};

const loadImageSource = async (
	file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> => {
	try {
		if ("createImageBitmap" in window) {
			const bitmap = await createImageBitmap(file);
			return {
				source: bitmap,
				width: bitmap.width,
				height: bitmap.height,
				release: () => {
					bitmap.close();
				},
			};
		}
	} catch (error) {
		console.warn("createImageBitmap failed, falling back to HTMLImageElement", error);
	}

	const objectUrl = URL.createObjectURL(file);
	const img = await new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = objectUrl;
	});

	return {
		source: img,
		width: img.naturalWidth,
		height: img.naturalHeight,
		release: () => URL.revokeObjectURL(objectUrl),
	};
};

export const convertImage = async (
	file: File,
	config: ConversionConfig,
	options?: ConvertImageOptions,
): Promise<ConversionResult> => {
	const { source, width, height, release } = await loadImageSource(file);
	try {
		const canvas = document.createElement("canvas");
		const ctx = drawOnCanvas(canvas, source, width, height);
		if (width === 0 || height === 0) {
			throw new Error("Conversion failed: decoded image has zero dimensions.");
		}

		if (config.format === "gif") {
			let imageData: ImageData;
			try {
				imageData = ctx.getImageData(0, 0, width, height);
			} catch (error) {
				console.error("[convertImage] getImageData failed for gif", error);
				throw error;
			}
			const blob = convertGifWithOptions(imageData, config.options);
			return {
				blob,
				url: URL.createObjectURL(blob),
				width,
				height,
			};
		}

		if (config.format === "png") {
			let imageData: ImageData;
			try {
				imageData = ctx.getImageData(0, 0, width, height);
			} catch (error) {
				console.error("[convertImage] getImageData failed for png", error);
				throw error;
			}
			const blob = convertPng(imageData, config.options);
			return {
				blob,
				url: URL.createObjectURL(blob),
				width,
				height,
			};
		}

		const mimeType = mimeMap[config.format];
		const qualityValue = qualityToFloat(config.quality);

		try {
			applyBoost(ctx, width, height, options?.boost ?? defaultBoost);
		} catch (error) {
			console.warn("[convertImage] boostHdr failed, continuing without boost", error);
		}

		const blob = await encodeCanvas(canvas, mimeType, qualityValue);
		if (!blob) {
			throw new Error(
				`Conversion failed: canvas encoding returned null for ${mimeType} even after dataURL fallback. The canvas was rendered in SDR; encoding in this format appears unsupported here.`,
			);
		}

		return {
			blob,
			url: URL.createObjectURL(blob),
			width,
			height,
		};
	} finally {
		release();
	}
};

export const getMimeType = (format: OutputFormat) => {
	if (format === "gif") return "image/gif";
	if (format === "png") return "image/png";
	return mimeMap[format];
};

export const SUPPORTED_INPUT_MIME_TYPES = supportedInputMimeTypes;

export const isSupportedInputFile = (file: File) => {
	const type = file.type?.toLowerCase();
	if (type && supportedInputMimeTypes.includes(type as (typeof supportedInputMimeTypes)[number])) {
		return true;
	}
	const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
	return extension.length > 0 && supportedInputExtensions.has(extension);
};
