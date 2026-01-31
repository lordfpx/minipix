import type {
	BoostSettings,
	GifConversionOptions,
	OutputFormat,
	PngConversionOptions,
} from "@/lib/imageConversion";

export interface ConversionItem {
	id: string;
	file: File;
	originalUrl: string;
	originalSize: number;
	convertedUrl?: string;
	convertedBlob?: Blob;
	status: "idle" | "processing" | "done" | "error";
	targetFormat: OutputFormat;
	quality: number;
	usesGlobalQuality: boolean;
	usesGlobalFormat: boolean;
	gifOptions: GifConversionOptions;
	pngOptions: PngConversionOptions;
	boost: BoostSettings;
	error?: string;
	compareSplit: number;
	width?: number;
	height?: number;
	isHdr?: boolean;
	version: number;
}

export const formatOptions: { value: OutputFormat; label: string }[] = [
	{ value: "jpeg", label: "JPEG (.jpg)" },
	{ value: "png", label: "PNG (.png)" },
	{ value: "webp", label: "WebP (.webp)" },
	{ value: "gif", label: "GIF (.gif)" },
];

export const defaultQuality = (format: OutputFormat) => {
	switch (format) {
		case "jpeg":
			return 82;
		case "webp":
			return 78;
		case "gif":
			return 90;
		default:
			return 100;
	}
};

export const createDefaultGifOptions = (): GifConversionOptions => ({
	colorCount: 128,
	dithering: "none",
	preserveAlpha: true,
	backgroundColor: "#ffffff",
	loopCount: 0,
});

export const createDefaultPngOptions = (): PngConversionOptions => ({
	colorCount: 256,
	reduceColors: false,
	preserveAlpha: true,
	backgroundColor: "#ffffff",
	interlaced: false,
});

export const createDefaultBoost = (): BoostSettings => ({
	exposure: 0,
	saturation: 1,
	contrast: 1,
	brightness: 0,
});
