import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";

import { ComparePreview } from "@/components/conversion-item/ComparePreview";
import { FormatSelector } from "@/components/conversion-item/FormatSelector";
import { ItemStats } from "@/components/conversion-item/ItemStats";
import { SettingsControls } from "@/components/conversion-item/SettingsControls";
import { SimpleBlock } from "@/components/ui/SimpleBlock";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { SimpleTitle } from "@/components/ui/SimpleTitle";
import type {
	BoostSettings,
	GifConversionOptions,
	OutputFormat,
	PngConversionOptions,
} from "@/lib/imageConversion";
import { type ConversionItem as ConversionItemType, formatOptions } from "@/types/conversion";

interface ConversionItemProps {
	item: ConversionItemType;
	globalFormat: OutputFormat;
	onFormatChange: (id: string, format: OutputFormat) => void;
	onQualityChange: (id: string, value: number) => void;
	onUseGlobalSettingsChange: (id: string, useGlobal: boolean) => void;
	onGifOptionsChange: (id: string, options: Partial<GifConversionOptions>) => void;
	onPngOptionsChange: (id: string, options: Partial<PngConversionOptions>) => void;
	onBoostChange: (id: string, options: Partial<BoostSettings>) => void;
	onSplitChange: (id: string, value: number) => void;
	onRemove: (id: string) => void;
}

const formatLabelMap = new Map(formatOptions.map((option) => [option.value, option.label]));

const ConversionItemComponent = ({
	item,
	globalFormat,
	onFormatChange,
	onQualityChange,
	onUseGlobalSettingsChange,
	onGifOptionsChange,
	onPngOptionsChange,
	onBoostChange,
	onSplitChange,
	onRemove,
}: ConversionItemProps) => {
	const {
		convertedSize,
		formatLabel,
		globalFormatLabel,
		usesGlobalSettings,
		qualityDisabled,
		formatDisabled,
		settingsDisabled,
		delta,
		gainRatio,
	} = useMemo(() => {
		const mappedFormatLabel = formatLabelMap.get(item.targetFormat) ?? item.targetFormat;
		const mappedGlobalLabel = formatLabelMap.get(globalFormat) ?? globalFormat;
		const converted = item.convertedBlob?.size ?? null;
		const isQualityFormat = item.targetFormat === "jpeg" || item.targetFormat === "webp";
		const globalSettings = item.usesGlobalFormat && (!isQualityFormat || item.usesGlobalQuality);
		const qualityDisabled = isQualityFormat && (item.usesGlobalQuality || globalSettings);
		const delta = converted !== null ? item.originalSize - converted : null;
		const gainRatio =
			delta !== null && item.originalSize > 0 ? (delta / item.originalSize) * 100 : null;
		return {
			convertedSize: converted,
			formatLabel: mappedFormatLabel,
			globalFormatLabel: mappedGlobalLabel,
			usesGlobalSettings: globalSettings,
			qualityDisabled,
			formatDisabled: globalSettings,
			settingsDisabled: globalSettings,
			delta,
			gainRatio,
		};
	}, [globalFormat, item]);

	const handleFormatSelect = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) =>
			onFormatChange(item.id, event.target.value as OutputFormat),
		[item.id, onFormatChange],
	);

	const handleUseGlobalToggle = useCallback(
		(event: ChangeEvent<HTMLInputElement>) =>
			onUseGlobalSettingsChange(item.id, event.target.checked),
		[item.id, onUseGlobalSettingsChange],
	);

	const [qualityDraft, setQualityDraft] = useState(item.quality);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		setQualityDraft(item.quality);
	}, [item.quality]);

	useEffect(() => {
		if (qualityDisabled) return;
		if (qualityDraft === item.quality) return;
		const handle = window.setTimeout(() => {
			onQualityChange(item.id, qualityDraft);
		}, 300);
		return () => window.clearTimeout(handle);
	}, [qualityDisabled, qualityDraft, item.id, item.quality, onQualityChange]);

	const handleQualityInputChange = useCallback((value: number) => {
		setQualityDraft(value);
	}, []);

	useEffect(() => {
		if (!item.convertedBlob) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(item.convertedBlob);
		setPreviewUrl(url);
		return () => {
			URL.revokeObjectURL(url);
		};
	}, [item.convertedBlob]);

	const updateGifOptions = useCallback(
		(options: Partial<GifConversionOptions>) => onGifOptionsChange(item.id, options),
		[item.id, onGifOptionsChange],
	);

	const updatePngOptions = useCallback(
		(options: Partial<PngConversionOptions>) => onPngOptionsChange(item.id, options),
		[item.id, onPngOptionsChange],
	);

	const updateBoost = useCallback(
		(options: Partial<BoostSettings>) => onBoostChange(item.id, options),
		[item.id, onBoostChange],
	);

	const handleSplitSlider = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => onSplitChange(item.id, Number(event.target.value)),
		[item.id, onSplitChange],
	);

	const handleRemove = useCallback(() => onRemove(item.id), [item.id, onRemove]);

	const canDownload = Boolean(item.convertedBlob);

	const handleDownload = useCallback(() => {
		if (!item.convertedBlob) return;
		const link = document.createElement("a");
		const extension = item.targetFormat === "jpeg" ? "jpg" : item.targetFormat;
		const url = URL.createObjectURL(item.convertedBlob);
		link.href = url;
		link.download = `${item.file.name.replace(/\.[^.]+$/, "")}.${extension}`;
		link.click();
		URL.revokeObjectURL(url);
	}, [item.convertedBlob, item.file.name, item.targetFormat]);

	return (
		<SimpleBlock className="ConversionItem space-y-4">
			<div className="mx-auto max-w-6xl flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1 flex gap-2 items-start w-full">
					<div className="flex items-center gap-2">
						<SimpleTitle as="h3">{item.file.name}</SimpleTitle>
						{item.isHdr ? (
							<span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
								HDR
							</span>
						) : null}
					</div>

					<div className="ml-auto flex gap-2">
						<SimpleButton
							disabled={!canDownload}
							onClick={handleDownload}
							className={!canDownload ? "cursor-not-allowed opacity-50" : undefined}
						>
							Export
						</SimpleButton>
						<SimpleButton onClick={handleRemove} variant="outline">
							&times;
							<span className="sr-only">Remove</span>
						</SimpleButton>
					</div>
				</div>
			</div>

			<div className="mx-auto grid max-w-6xl grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-4">
				<div className="flex flex-col gap-4">
					<label className="flex items-center gap-2 text-xs text-muted-foreground">
						<input
							type="checkbox"
							checked={usesGlobalSettings}
							onChange={handleUseGlobalToggle}
							className="h-4 w-4 border border-border"
						/>
						<b>Use default settings</b> - {globalFormatLabel}
					</label>

					<FormatSelector
						value={item.targetFormat}
						disabled={formatDisabled}
						onFormatChange={handleFormatSelect}
					/>
					<SettingsControls
						targetFormat={item.targetFormat}
						quality={qualityDraft}
						qualityDisabled={qualityDisabled}
						gifOptions={item.gifOptions}
						pngOptions={item.pngOptions}
						boost={item.boost}
						settingsDisabled={settingsDisabled}
						onQualityChange={handleQualityInputChange}
						onGifOptionsChange={updateGifOptions}
						onPngOptionsChange={updatePngOptions}
						onBoostChange={updateBoost}
					/>
				</div>

				<ItemStats
					fileType={item.file.type || "Auto"}
					formatLabel={formatLabel}
					width={item.width}
					height={item.height}
					originalSize={item.originalSize}
					convertedSize={convertedSize}
					delta={delta}
					gainRatio={gainRatio}
				/>
			</div>

			<ComparePreview
				originalUrl={item.originalUrl}
				convertedUrl={previewUrl}
				compareSplit={item.compareSplit}
				status={item.status}
				error={item.error}
				onSplitChange={handleSplitSlider}
			/>
		</SimpleBlock>
	);
};

export const ConversionItem = memo(ConversionItemComponent);
