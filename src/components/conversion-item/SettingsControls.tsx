import { memo, useState } from "react";

import { SimpleBlock } from "@/components/ui/SimpleBlock";
import { SimpleField } from "@/components/ui/SimpleField";
import { SimpleTitle } from "@/components/ui/SimpleTitle";
import type {
	BoostSettings,
	GifConversionOptions,
	OutputFormat,
	PngConversionOptions,
} from "@/lib/imageConversion";
import { createDefaultBoost } from "@/types/conversion";

interface SettingsControlsProps {
	targetFormat: OutputFormat;
	quality: number;
	qualityDisabled: boolean;
	gifOptions: GifConversionOptions;
	pngOptions: PngConversionOptions;
	boost: BoostSettings;
	settingsDisabled: boolean;
	onQualityChange: (value: number) => void;
	onGifOptionsChange: (options: Partial<GifConversionOptions>) => void;
	onPngOptionsChange: (options: Partial<PngConversionOptions>) => void;
	onBoostChange: (options: Partial<BoostSettings>) => void;
}

export const SettingsControls = memo(
	({
		targetFormat,
		quality,
		qualityDisabled,
		gifOptions,
		pngOptions,
		boost,
		settingsDisabled,
		onQualityChange,
		onGifOptionsChange,
		onPngOptionsChange,
		onBoostChange,
	}: SettingsControlsProps) => {
		const [showBoost, setShowBoost] = useState(false);
		const boostPanel = (
			<div className="space-y-2">
				<button
					type="button"
					onClick={() => setShowBoost((prev) => !prev)}
					className="rounded border border-border px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-accent"
				>
					{showBoost ? "🔼 image adjustments" : "🔽 image adjustments"}
				</button>
				{showBoost ? (
					<BoostControls
						boost={boost}
						onChange={onBoostChange}
						onReset={() => onBoostChange(createDefaultBoost())}
					/>
				) : null}
			</div>
		);

		if (targetFormat === "gif") {
			return (
				<div className="space-y-4">
					<GifOptionsControls
						options={gifOptions}
						disabled={settingsDisabled}
						onChange={onGifOptionsChange}
					/>
				</div>
			);
		}
		if (targetFormat === "png") {
			return (
				<div className="space-y-4">
					<PngOptionsControls
						options={pngOptions}
						disabled={settingsDisabled}
						onChange={onPngOptionsChange}
					/>
				</div>
			);
		}
		return (
			<div className="space-y-4">
				<QualityControls value={quality} disabled={qualityDisabled} onChange={onQualityChange} />
				{boostPanel}
			</div>
		);
	},
);

interface QualityControlsProps {
	value: number;
	disabled: boolean;
	onChange: (value: number) => void;
}

const QualityControls = memo(({ value, disabled, onChange }: QualityControlsProps) => (
	<SimpleField label="Quality" className="md:w-full">
		<div className="flex items-center gap-3">
			<input
				type="range"
				min={0}
				max={100}
				step={1}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(Number(event.target.value))}
				className="h-2 w-full"
			/>
			<span className="w-12 text-sm text-muted-foreground">{value}</span>
		</div>
	</SimpleField>
));

interface GifOptionsControlsProps {
	options: GifConversionOptions;
	disabled: boolean;
	onChange: (options: Partial<GifConversionOptions>) => void;
}

const GifOptionsControls = memo(({ options, disabled, onChange }: GifOptionsControlsProps) => {
	const showBackground = !options.preserveAlpha;
	return (
		<SimpleBlock className="space-y-3">
			<SimpleTitle as="h4" className="text-base">
				GIF options
			</SimpleTitle>
			<div className="space-y-3 text-sm text-muted-foreground">
				<label className="flex flex-col gap-1">
					<span>Number of colors</span>
					<div className="flex items-center gap-3">
						<input
							type="range"
							min={2}
							max={256}
							step={1}
							value={options.colorCount}
							disabled={disabled}
							onChange={(event) => onChange({ colorCount: Number(event.target.value) })}
							className="h-2 w-full"
						/>
						<span className="w-12 text-right">{options.colorCount}</span>
					</div>
				</label>

				<label className="flex flex-col gap-1">
					<span>Dithering</span>
					<select
						value={options.dithering}
						disabled={disabled}
						onChange={(event) =>
							onChange({ dithering: event.target.value as GifConversionOptions["dithering"] })
						}
						className="w-full border border-border bg-surface px-2 py-2 text-sm text-foreground transition disabled:opacity-60"
					>
						<option value="none">None</option>
						<option value="floyd-steinberg">Floyd-Steinberg</option>
					</select>
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={options.preserveAlpha}
						disabled={disabled}
						onChange={(event) => onChange({ preserveAlpha: event.target.checked })}
						className="h-4 w-4 border border-border disabled:opacity-50"
					/>
					<span>Preserve transparency</span>
				</label>

				{showBackground ? (
					<label className="flex items-center gap-3">
						<span>Background color</span>
						<input
							type="color"
							value={options.backgroundColor}
							disabled={disabled}
							onChange={(event) => onChange({ backgroundColor: event.target.value })}
							className="h-8 w-12 border border-border bg-surface disabled:opacity-60"
						/>
					</label>
				) : null}

				<label className="flex flex-col gap-1">
					<span>Loop count (0 = infinite)</span>
					<input
						type="number"
						min={-1}
						value={options.loopCount}
						disabled={disabled}
						onChange={(event) => onChange({ loopCount: Number(event.target.value) })}
						className="w-full border border-border px-2 py-2 text-sm text-foreground transition disabled:opacity-60"
					/>
				</label>
			</div>
		</SimpleBlock>
	);
});

interface PngOptionsControlsProps {
	options: PngConversionOptions;
	disabled: boolean;
	onChange: (options: Partial<PngConversionOptions>) => void;
}

const PngOptionsControls = memo(({ options, disabled, onChange }: PngOptionsControlsProps) => {
	const showBackground = !options.preserveAlpha;
	return (
		<SimpleBlock className="space-y-3">
			<SimpleTitle as="h4" className="text-base">
				PNG options
			</SimpleTitle>
			<div className="space-y-3 text-sm text-muted-foreground">
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={options.reduceColors}
						disabled={disabled}
						onChange={(event) => onChange({ reduceColors: event.target.checked })}
						className="h-4 w-4 border border-border disabled:opacity-50"
					/>
					<span>Reduce color count</span>
				</label>

				<label className="flex flex-col gap-1">
					<span>Palette (2 – 256)</span>
					<div className="flex items-center gap-3">
						<input
							type="range"
							min={2}
							max={256}
							step={1}
							value={options.colorCount}
							disabled={!options.reduceColors || disabled}
							onChange={(event) => onChange({ colorCount: Number(event.target.value) })}
							className="h-2 w-full disabled:opacity-40"
						/>
						<span className="w-12 text-right">{options.colorCount}</span>
					</div>
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={options.preserveAlpha}
						disabled={disabled}
						onChange={(event) => onChange({ preserveAlpha: event.target.checked })}
						className="h-4 w-4 border border-border disabled:opacity-50"
					/>
					<span>Preserve transparency</span>
				</label>

				{showBackground ? (
					<label className="flex items-center gap-3">
						<span>Background color</span>
						<input
							type="color"
							value={options.backgroundColor}
							disabled={disabled}
							onChange={(event) => onChange({ backgroundColor: event.target.value })}
							className="h-8 w-12 border border-border bg-surface disabled:opacity-60"
						/>
					</label>
				) : null}

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={options.interlaced}
						disabled={disabled}
						onChange={(event) => onChange({ interlaced: event.target.checked })}
						className="h-4 w-4 border border-border disabled:opacity-50"
					/>
					<span>Interlaced (progressive)</span>
				</label>
			</div>
		</SimpleBlock>
	);
});

interface BoostControlsProps {
	boost: BoostSettings;
	onChange: (options: Partial<BoostSettings>) => void;
	onReset: () => void;
}

const BoostControls = memo(({ boost, onChange, onReset }: BoostControlsProps) => (
	<SimpleBlock className="space-y-3">
		<SimpleTitle as="h4" className="text-base">
			Image boost
		</SimpleTitle>
		<div className="flex flex-col gap-3 text-sm text-muted-foreground">
			<button
				type="button"
				onClick={onReset}
				className="self-start rounded border border-border px-2 py-1 text-xs text-foreground transition hover:bg-accent disabled:opacity-50"
			>
				Réinitialiser
			</button>
			<SimpleField label="Exposure (stops)">
				<div className="flex items-center gap-3">
					<input
						type="range"
						min={-1}
						max={1}
						step={0.05}
						value={boost.exposure}
						onChange={(event) => onChange({ exposure: Number(event.target.value) })}
						className="h-2 w-full"
					/>
					<span className="w-14 text-right">{boost.exposure.toFixed(2)}</span>
				</div>
			</SimpleField>

			<SimpleField label="Saturation">
				<div className="flex items-center gap-3">
					<input
						type="range"
						min={0}
						max={2}
						step={0.05}
						value={boost.saturation}
						onChange={(event) => onChange({ saturation: Number(event.target.value) })}
						className="h-2 w-full"
					/>
					<span className="w-14 text-right">{boost.saturation.toFixed(2)}x</span>
				</div>
			</SimpleField>

			<SimpleField label="Contrast">
				<div className="flex items-center gap-3">
					<input
						type="range"
						min={0.5}
						max={2}
						step={0.05}
						value={boost.contrast}
						onChange={(event) => onChange({ contrast: Number(event.target.value) })}
						className="h-2 w-full"
					/>
					<span className="w-14 text-right">{boost.contrast.toFixed(2)}x</span>
				</div>
			</SimpleField>

			<SimpleField label="Brightness">
				<div className="flex items-center gap-3">
					<input
						type="range"
						min={-50}
						max={50}
						step={1}
						value={boost.brightness}
						onChange={(event) => onChange({ brightness: Number(event.target.value) })}
						className="h-2 w-full"
					/>
					<span className="w-14 text-right">{boost.brightness}</span>
				</div>
			</SimpleField>
		</div>
	</SimpleBlock>
));
