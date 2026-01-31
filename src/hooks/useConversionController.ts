import { saveAs } from "file-saver";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createArchiveFromConversions } from "@/lib/downloadAll";
import { detectHdrImage } from "@/lib/hdrDetection";
import {
	convertImage,
	type GifConversionOptions,
	getDefaultOutputFormat,
	getOutputFormatSupport,
	isSupportedInputFile,
	type OutputFormat,
	type OutputFormatSupport,
	type PngConversionOptions,
} from "@/lib/imageConversion";
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "@/lib/uploadLimits";
import { createId, formatBytes } from "@/lib/utils";
import {
	type ConversionItem,
	createDefaultBoost,
	createDefaultGifOptions,
	createDefaultPngOptions,
	defaultQuality,
} from "@/types/conversion";

const formatUsesQuality = (format: OutputFormat) => format === "jpeg" || format === "webp";

const cloneGifOptions = (options: GifConversionOptions): GifConversionOptions => ({ ...options });

const clonePngOptions = (options: PngConversionOptions): PngConversionOptions => ({ ...options });

const isGifOptionsEqual = (a: GifConversionOptions, b: GifConversionOptions) =>
	a.colorCount === b.colorCount &&
	a.dithering === b.dithering &&
	a.preserveAlpha === b.preserveAlpha &&
	a.backgroundColor === b.backgroundColor &&
	a.loopCount === b.loopCount;

const isPngOptionsEqual = (a: PngConversionOptions, b: PngConversionOptions) =>
	a.colorCount === b.colorCount &&
	a.reduceColors === b.reduceColors &&
	a.preserveAlpha === b.preserveAlpha &&
	a.backgroundColor === b.backgroundColor &&
	a.interlaced === b.interlaced;

const createProcessingUpdate = (
	item: ConversionItem,
	overrides: Partial<ConversionItem>,
): ConversionItem => ({
	...item,
	...overrides,
	version: item.version + 1,
	status: "processing",
	error: undefined,
});

interface UseConversionControllerResult {
	items: ConversionItem[];
	outputSupport: OutputFormatSupport;
	globalFormat: OutputFormat;
	globalQuality: number;
	globalGifOptions: GifConversionOptions;
	globalPngOptions: PngConversionOptions;
	averageReduction: {
		convertedTotal: number;
		originalTotal: number;
		delta: number;
		ratio: number;
	} | null;
	conversionProgress: {
		value: number;
		completed: number;
		total: number;
		isActive: boolean;
	} | null;
	uploadError: string | null;
	hasItems: boolean;
	hasDownloadableItems: boolean;
	isExporting: boolean;
	handleFiles: (files: FileList | null) => void;
	handleFormatChange: (id: string, format: OutputFormat) => void;
	handleQualityChange: (id: string, value: number) => void;
	handleUseGlobalSettingsChange: (id: string, useGlobal: boolean) => void;
	handleGifOptionsChange: (id: string, options: Partial<GifConversionOptions>) => void;
	handlePngOptionsChange: (id: string, options: Partial<PngConversionOptions>) => void;
	handleBoostChange: (id: string, options: Partial<ConversionItem["boost"]>) => void;
	handleGlobalQualityChange: (value: number) => void;
	handleGlobalFormatChange: (format: OutputFormat) => void;
	handleGlobalGifOptionsChange: (options: Partial<GifConversionOptions>) => void;
	handleGlobalPngOptionsChange: (options: Partial<PngConversionOptions>) => void;
	handleSplitChange: (id: string, value: number) => void;
	removeItem: (id: string) => void;
	clearAll: () => void;
	downloadAll: () => Promise<void>;
}

export const useConversionController = (): UseConversionControllerResult => {
	const [outputSupport] = useState<OutputFormatSupport>(() => getOutputFormatSupport());
	const [items, setItems] = useState<ConversionItem[]>([]);
	const [globalFormat, setGlobalFormat] = useState<OutputFormat>(() => getDefaultOutputFormat());
	const [globalQuality, setGlobalQuality] = useState(() =>
		defaultQuality(getDefaultOutputFormat()),
	);
	const [globalGifOptions, setGlobalGifOptions] = useState(createDefaultGifOptions);
	const [globalPngOptions, setGlobalPngOptions] = useState(createDefaultPngOptions);
	const [isExporting, setIsExporting] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const itemsRef = useRef<ConversionItem[]>([]);

	useEffect(() => {
		itemsRef.current = items;
	}, [items]);

	const releaseResources = useCallback((item: ConversionItem) => {
		URL.revokeObjectURL(item.originalUrl);
		if (item.convertedUrl) {
			URL.revokeObjectURL(item.convertedUrl);
		}
	}, []);

	useEffect(() => {
		return () => {
			itemsRef.current.forEach(releaseResources);
		};
	}, [releaseResources]);

	const runConversion = useCallback(async (job: ConversionItem) => {
		const jobVersion = job.version;
		try {
			const result = await convertImage(
				job.file,
				job.targetFormat === "gif"
					? { format: "gif", options: job.gifOptions }
					: job.targetFormat === "png"
						? { format: "png", options: job.pngOptions }
						: { format: job.targetFormat, quality: job.quality },
				{ boost: job.boost },
			);
			let applied = false;
			setItems((prev) =>
				prev.map((item) => {
					if (item.id !== job.id) return item;
					if (item.version !== jobVersion) return item;
					if (item.convertedUrl && item.convertedUrl !== result.url) {
						URL.revokeObjectURL(item.convertedUrl);
					}
					applied = true;
					return {
						...item,
						convertedBlob: result.blob,
						convertedUrl: result.url,
						status: "done",
						width: result.width,
						height: result.height,
					};
				}),
			);
			if (!applied) {
				URL.revokeObjectURL(result.url);
			}
		} catch (error) {
			const normalizedError =
				error instanceof Error
					? { name: error.name, message: error.message, stack: error.stack }
					: { value: error };
			console.error("[convertImage] job failed", {
				id: job.id,
				format: job.targetFormat,
				isHdr: job.isHdr,
				error: normalizedError,
			});
			const message =
				error instanceof Error
					? error.message || error.name || "Conversion failed."
					: typeof error === "string"
						? error
						: error
							? JSON.stringify(error)
							: "Conversion failed.";
			setItems((prev) =>
				prev.map((item) =>
					item.id === job.id && item.version === jobVersion
						? {
								...item,
								status: "error",
								error: message,
							}
						: item,
				),
			);
		}
	}, []);

	const queueConversion = useCallback(
		(updated: ConversionItem) => {
			queueMicrotask(() => runConversion(updated));
		},
		[runConversion],
	);

	const scheduleConversion = useCallback(
		(
			id: string,
			overrides?:
				| Partial<
						Pick<
							ConversionItem,
							| "targetFormat"
							| "quality"
							| "usesGlobalQuality"
							| "usesGlobalFormat"
							| "gifOptions"
							| "pngOptions"
							| "boost"
						>
				  >
				| ((item: ConversionItem) => Partial<ConversionItem>),
		) => {
			setItems((prev) =>
				prev.map((item) => {
					if (item.id !== id) return item;
					const patch = typeof overrides === "function" ? overrides(item) : (overrides ?? {});
					const updated = createProcessingUpdate(item, patch);
					queueConversion(updated);
					return updated;
				}),
			);
		},
		[queueConversion],
	);

	const setHdrFlag = useCallback((id: string, isHdr: boolean) => {
		setItems((prev) => {
			let found = false;
			const next = prev.map((item) => {
				if (item.id !== id) return item;
				found = true;
				if (item.isHdr === isHdr) return item;
				return { ...item, isHdr };
			});
			return found ? next : prev;
		});
	}, []);

	const detectHdrForItem = useCallback(
		(id: string, file: File) => {
			console.log("[HDR] Scheduling detection for", file.name);
			detectHdrImage(file)
				.then((isHdr) => setHdrFlag(id, isHdr))
				.catch((error) => {
					console.warn("[HDR] Detection threw", error);
				});
		},
		[setHdrFlag],
	);

	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return;
			const additions: ConversionItem[] = [];
			const unsupportedFiles: string[] = [];
			const oversizedFiles: string[] = [];
			const tooLargeFiles: string[] = [];
			const hdrCandidates: { id: string; file: File }[] = [];
			const totalLimitLabel = formatBytes(MAX_TOTAL_BYTES);
			const singleLimitLabel = formatBytes(MAX_FILE_BYTES);
			let runningTotal = itemsRef.current.reduce((acc, item) => acc + item.originalSize, 0);
			for (const file of files) {
				if (!isSupportedInputFile(file)) {
					unsupportedFiles.push(file.name);
					continue;
				}
				if (file.size > MAX_FILE_BYTES) {
					tooLargeFiles.push(file.name);
					continue;
				}
				if (runningTotal + file.size > MAX_TOTAL_BYTES) {
					oversizedFiles.push(file.name);
					continue;
				}
				const originalUrl = URL.createObjectURL(file);
				const targetFormat: OutputFormat = globalFormat;
				const usesGlobalQuality = formatUsesQuality(targetFormat);
				const quality = usesGlobalQuality ? globalQuality : defaultQuality(targetFormat);
				const job: ConversionItem = {
					id: createId(),
					file,
					originalUrl,
					originalSize: file.size,
					targetFormat,
					quality,
					usesGlobalQuality,
					usesGlobalFormat: true,
					gifOptions: cloneGifOptions(globalGifOptions),
					pngOptions: clonePngOptions(globalPngOptions),
					boost: createDefaultBoost(),
					status: "processing",
					compareSplit: 50,
					version: 1,
				};
				additions.push(job);
				hdrCandidates.push({ id: job.id, file });
				runningTotal += file.size;
			}
			if (additions.length > 0) {
				setItems((prev) => [...prev, ...additions]);
				additions.forEach((job) => {
					queueConversion(job);
				});
				hdrCandidates.forEach(({ id, file }) => {
					console.log("[HDR] Queueing detection for", file.name);
					queueMicrotask(() => detectHdrForItem(id, file));
				});
			}
			const messages: string[] = [];
			if (unsupportedFiles.length > 0) {
				messages.push(
					unsupportedFiles.length === 1
						? `Le format du fichier "${unsupportedFiles[0]}" n'est pas supporté.`
						: `Les formats des fichiers suivants ne sont pas supportés : ${unsupportedFiles.join(", ")}.`,
				);
			}
			if (tooLargeFiles.length > 0) {
				messages.push(
					tooLargeFiles.length === 1
						? `Impossible d'ajouter "${tooLargeFiles[0]}" car il dépasse ${singleLimitLabel}.`
						: `Impossible d'ajouter ces fichiers (${tooLargeFiles.join(
								", ",
							)}) car chacun dépasse ${singleLimitLabel}.`,
				);
			}
			if (oversizedFiles.length > 0) {
				messages.push(
					oversizedFiles.length === 1
						? `Impossible d'ajouter "${oversizedFiles[0]}" car la taille totale dépasserait ${totalLimitLabel}.`
						: `Impossible d'ajouter ces fichiers (${oversizedFiles.join(
								", ",
							)}) car la taille totale dépasserait ${totalLimitLabel}.`,
				);
			}
			setUploadError(messages.length > 0 ? messages.join(" ") : null);
		},
		[
			detectHdrForItem,
			globalFormat,
			globalGifOptions,
			globalPngOptions,
			globalQuality,
			queueConversion,
		],
	);

	const removeItem = useCallback(
		(id: string) => {
			setItems((prev) => {
				const target = prev.find((item) => item.id === id);
				if (target) {
					releaseResources(target);
				}
				return prev.filter((item) => item.id !== id);
			});
		},
		[releaseResources],
	);

	const clearAll = useCallback(() => {
		setItems((prev) => {
			prev.forEach(releaseResources);
			return [];
		});
	}, [releaseResources]);

	const handleFormatChange = useCallback(
		(id: string, format: OutputFormat) => {
			const current = itemsRef.current.find((item) => item.id === id);
			if (!current) return;
			const usesSlider = formatUsesQuality(format);
			const shouldUseGlobal = usesSlider ? Boolean(current.usesGlobalQuality) : false;
			const baseQuality = usesSlider
				? shouldUseGlobal
					? globalQuality
					: defaultQuality(format)
				: defaultQuality(format);
			const nextUsesGlobalQuality = usesSlider ? shouldUseGlobal : false;
			const nextUsesGlobalFormat =
				current.usesGlobalFormat && format === current.targetFormat
					? current.usesGlobalFormat
					: false;
			const gifOptionsEqual =
				format === "gif" ? isGifOptionsEqual(current.gifOptions, globalGifOptions) : true;
			const pngOptionsEqual =
				format === "png" ? isPngOptionsEqual(current.pngOptions, globalPngOptions) : true;

			if (
				format === current.targetFormat &&
				current.quality === baseQuality &&
				current.usesGlobalQuality === nextUsesGlobalQuality &&
				current.usesGlobalFormat === nextUsesGlobalFormat &&
				gifOptionsEqual &&
				pngOptionsEqual
			) {
				return;
			}
			scheduleConversion(id, (item) => ({
				targetFormat: format,
				quality: baseQuality,
				usesGlobalQuality: nextUsesGlobalQuality,
				usesGlobalFormat:
					item.usesGlobalFormat && format === item.targetFormat ? item.usesGlobalFormat : false,
				gifOptions: format === "gif" ? cloneGifOptions(globalGifOptions) : item.gifOptions,
				pngOptions: format === "png" ? clonePngOptions(globalPngOptions) : item.pngOptions,
			}));
		},
		[globalGifOptions, globalPngOptions, globalQuality, scheduleConversion],
	);

	const handleQualityChange = useCallback(
		(id: string, value: number) => {
			scheduleConversion(id, { quality: value, usesGlobalQuality: false });
		},
		[scheduleConversion],
	);

	const handleUseGlobalSettingsChange = useCallback(
		(id: string, useGlobal: boolean) => {
			const current = itemsRef.current.find((item) => item.id === id);
			if (!current) return;
			if (useGlobal) {
				const nextFormat = globalFormat;
				const formatHasQuality = formatUsesQuality(nextFormat);
				const nextQuality = formatHasQuality ? globalQuality : defaultQuality(nextFormat);
				scheduleConversion(id, {
					targetFormat: nextFormat,
					quality: nextQuality,
					usesGlobalFormat: true,
					usesGlobalQuality: formatHasQuality,
					gifOptions: nextFormat === "gif" ? cloneGifOptions(globalGifOptions) : current.gifOptions,
					pngOptions: nextFormat === "png" ? clonePngOptions(globalPngOptions) : current.pngOptions,
				});
			} else {
				if (!current.usesGlobalFormat && !current.usesGlobalQuality) return;
				setItems((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									usesGlobalFormat: false,
									usesGlobalQuality: false,
								}
							: item,
					),
				);
			}
		},
		[globalFormat, globalGifOptions, globalPngOptions, globalQuality, scheduleConversion],
	);

	const handleGifOptionsChange = useCallback(
		(id: string, options: Partial<GifConversionOptions>) => {
			scheduleConversion(id, (item) => ({
				gifOptions: { ...item.gifOptions, ...options },
			}));
		},
		[scheduleConversion],
	);

	const handlePngOptionsChange = useCallback(
		(id: string, options: Partial<PngConversionOptions>) => {
			scheduleConversion(id, (item) => ({
				pngOptions: { ...item.pngOptions, ...options },
			}));
		},
		[scheduleConversion],
	);

	const handleBoostChange = useCallback(
		(id: string, options: Partial<ConversionItem["boost"]>) => {
			scheduleConversion(id, (item) => ({
				boost: { ...item.boost, ...options },
			}));
		},
		[scheduleConversion],
	);

	const handleGlobalQualityChange = useCallback(
		(value: number) => {
			setGlobalQuality(value);
			setItems((prev) => {
				const next = prev.map((item) => {
					if (!item.usesGlobalQuality || !formatUsesQuality(item.targetFormat)) return item;
					const updated = createProcessingUpdate(item, { quality: value });
					queueConversion(updated);
					return updated;
				});
				return next;
			});
		},
		[queueConversion],
	);

	const handleGlobalGifOptionsChange = useCallback(
		(options: Partial<GifConversionOptions>) => {
			setGlobalGifOptions((prev) => {
				const next = { ...prev, ...options };
				setItems((prevItems) =>
					prevItems.map((item) => {
						if (item.targetFormat !== "gif" || !item.usesGlobalFormat) return item;
						const updated = createProcessingUpdate(item, { gifOptions: cloneGifOptions(next) });
						queueConversion(updated);
						return updated;
					}),
				);
				return next;
			});
		},
		[queueConversion],
	);

	const handleGlobalPngOptionsChange = useCallback(
		(options: Partial<PngConversionOptions>) => {
			setGlobalPngOptions((prev) => {
				const next = { ...prev, ...options };
				setItems((prevItems) =>
					prevItems.map((item) => {
						if (item.targetFormat !== "png" || !item.usesGlobalFormat) return item;
						const updated = createProcessingUpdate(item, { pngOptions: clonePngOptions(next) });
						queueConversion(updated);
						return updated;
					}),
				);
				return next;
			});
		},
		[queueConversion],
	);

	const handleGlobalFormatChange = useCallback(
		(format: OutputFormat) => {
			if (format === globalFormat) return;
			setGlobalFormat(format);
			setItems((prev) => {
				const formatHasQuality = formatUsesQuality(format);
				const next = prev.map((item) => {
					if (!item.usesGlobalFormat) return item;
					const usesGlobalQuality = formatHasQuality ? item.usesGlobalQuality : false;
					const nextQuality = formatHasQuality
						? usesGlobalQuality
							? globalQuality
							: item.quality
						: defaultQuality(format);
					const updated = createProcessingUpdate(item, {
						targetFormat: format,
						quality: nextQuality,
						usesGlobalFormat: true,
						usesGlobalQuality,
						gifOptions: format === "gif" ? cloneGifOptions(globalGifOptions) : item.gifOptions,
						pngOptions: format === "png" ? clonePngOptions(globalPngOptions) : item.pngOptions,
					});
					queueConversion(updated);
					return updated;
				});
				return next;
			});
		},
		[globalFormat, globalGifOptions, globalPngOptions, globalQuality, queueConversion],
	);

	const handleSplitChange = useCallback((id: string, value: number) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id
					? {
							...item,
							compareSplit: value,
						}
					: item,
			),
		);
	}, []);

	const averageReduction = useMemo(() => {
		const successful = items.filter((item) => item.status === "done" && item.convertedBlob);
		if (successful.length === 0) return null;
		const originalTotal = successful.reduce((acc, item) => acc + item.originalSize, 0);
		const convertedTotal = successful.reduce(
			(acc, item) => acc + (item.convertedBlob?.size ?? 0),
			0,
		);
		const delta = originalTotal - convertedTotal;
		return {
			convertedTotal,
			originalTotal,
			delta,
			ratio: originalTotal > 0 ? (delta / originalTotal) * 100 : 0,
		};
	}, [items]);

	const hasDownloadableItems = useMemo(() => items.some((item) => item.convertedBlob), [items]);

	const conversionProgress = useMemo(() => {
		if (items.length === 0) return null;
		const completed = items.filter((item) => item.status === "done").length;
		const total = items.length;
		const isActive = items.some((item) => item.status === "processing");
		return {
			value: total === 0 ? 0 : completed / total,
			completed,
			total,
			isActive,
		};
	}, [items]);

	const downloadAll = useCallback(async () => {
		if (isExporting) return;
		const ready = itemsRef.current.filter((item) => item.convertedBlob);
		if (ready.length === 0) return;
		setIsExporting(true);
		try {
			const archive = await createArchiveFromConversions(ready);
			if (!archive) return;
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			saveAs(archive, `conversions-${timestamp}.zip`);
		} finally {
			setIsExporting(false);
		}
	}, [isExporting]);

	return {
		items,
		outputSupport,
		globalFormat,
		globalQuality,
		globalGifOptions,
		globalPngOptions,
		handleBoostChange,
		averageReduction,
		conversionProgress,
		uploadError,
		hasItems: items.length > 0,
		hasDownloadableItems,
		isExporting,
		handleFiles,
		handleFormatChange,
		handleQualityChange,
		handleUseGlobalSettingsChange,
		handleGifOptionsChange,
		handlePngOptionsChange,
		handleGlobalQualityChange,
		handleGlobalFormatChange,
		handleGlobalGifOptionsChange,
		handleGlobalPngOptionsChange,
		handleSplitChange,
		removeItem,
		clearAll,
		downloadAll,
	};
};
