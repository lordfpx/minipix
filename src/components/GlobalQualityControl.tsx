import { SimpleBlock } from "@/components/ui/SimpleBlock";
import { SimpleField } from "@/components/ui/SimpleField";
import { SimpleTitle } from "@/components/ui/SimpleTitle";
import type {
	GifConversionOptions,
	OutputFormat,
	OutputFormatSupport,
	PngConversionOptions,
} from "@/lib/imageConversion";
import { formatOptions } from "@/types/conversion";

interface GlobalQualityControlProps {
	format: OutputFormat;
	outputSupport: OutputFormatSupport;
	onFormatChange: (format: OutputFormat) => void;
	quality: number;
	onQualityChange: (value: number) => void;
	gifOptions: GifConversionOptions;
	pngOptions: PngConversionOptions;
	onGifOptionsChange: (options: Partial<GifConversionOptions>) => void;
	onPngOptionsChange: (options: Partial<PngConversionOptions>) => void;
}

export const GlobalQualityControl = ({
	format,
	outputSupport,
	onFormatChange,
	quality,
	onQualityChange,
	gifOptions,
	pngOptions,
	onGifOptionsChange,
	onPngOptionsChange,
}: GlobalQualityControlProps) => {
	const renderQualityControls = () => (
		<SimpleField label="Quality">
			<div className="flex items-center gap-3">
				<input
					type="range"
					min={0}
					max={100}
					step={1}
					value={quality}
					onChange={(event) => onQualityChange(Number(event.target.value))}
					className="h-2 w-full"
				/>
				<span className="w-12 text-sm text-muted-foreground">{quality}</span>
			</div>
		</SimpleField>
	);

	const renderGifControls = () => {
		const showBackground = !gifOptions.preserveAlpha;
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
								value={gifOptions.colorCount}
								onChange={(event) => onGifOptionsChange({ colorCount: Number(event.target.value) })}
								className="h-2 w-full"
							/>
							<span className="w-12 text-right">{gifOptions.colorCount}</span>
						</div>
					</label>

					<label className="flex flex-col gap-1">
						<span>Dithering</span>
						<select
							value={gifOptions.dithering}
							onChange={(event) =>
								onGifOptionsChange({
									dithering: event.target.value as GifConversionOptions["dithering"],
								})
							}
							className="w-full border border-border bg-surface px-2 py-2 text-sm text-foreground transition"
						>
							<option value="none">None</option>
							<option value="floyd-steinberg">Floyd-Steinberg</option>
						</select>
					</label>

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={gifOptions.preserveAlpha}
							onChange={(event) => onGifOptionsChange({ preserveAlpha: event.target.checked })}
							className="h-4 w-4 border border-border"
						/>
						<span>Preserve transparency</span>
					</label>

					{showBackground ? (
						<label className="flex items-center gap-3">
							<span>Background color</span>
							<input
								type="color"
								value={gifOptions.backgroundColor}
								onChange={(event) => onGifOptionsChange({ backgroundColor: event.target.value })}
								className="h-8 w-12 border border-border bg-surface"
							/>
						</label>
					) : null}

					<label className="flex flex-col gap-1">
						<span>Loop count (0 = infinite)</span>
						<input
							type="number"
							min={-1}
							value={gifOptions.loopCount}
							onChange={(event) => onGifOptionsChange({ loopCount: Number(event.target.value) })}
							className="w-full border border-border px-2 py-2 text-sm text-foreground transition"
						/>
					</label>
				</div>
			</SimpleBlock>
		);
	};

	const renderPngControls = () => {
		const showBackground = !pngOptions.preserveAlpha;
		return (
			<SimpleBlock className="space-y-3">
				<SimpleTitle as="h4" className="text-base">
					PNG options
				</SimpleTitle>
				<div className="space-y-3 text-sm text-muted-foreground">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={pngOptions.reduceColors}
							onChange={(event) => onPngOptionsChange({ reduceColors: event.target.checked })}
							className="h-4 w-4 border border-border"
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
								value={pngOptions.colorCount}
								disabled={!pngOptions.reduceColors}
								onChange={(event) => onPngOptionsChange({ colorCount: Number(event.target.value) })}
								className="h-2 w-full disabled:opacity-40"
							/>
							<span className="w-12 text-right">{pngOptions.colorCount}</span>
						</div>
					</label>

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={pngOptions.preserveAlpha}
							onChange={(event) => onPngOptionsChange({ preserveAlpha: event.target.checked })}
							className="h-4 w-4 border border-border"
						/>
						<span>Preserve transparency</span>
					</label>

					{showBackground ? (
						<label className="flex items-center gap-3">
							<span>Background color</span>
							<input
								type="color"
								value={pngOptions.backgroundColor}
								onChange={(event) => onPngOptionsChange({ backgroundColor: event.target.value })}
								className="h-8 w-12 border border-border bg-surface"
							/>
						</label>
					) : null}

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={pngOptions.interlaced}
							onChange={(event) => onPngOptionsChange({ interlaced: event.target.checked })}
							className="h-4 w-4 border border-border"
						/>
						<span>Interlaced (progressive)</span>
					</label>
				</div>
			</SimpleBlock>
		);
	};

	const renderControls = () => {
		if (format === "gif") return renderGifControls();
		if (format === "png") return renderPngControls();
		return renderQualityControls();
	};

	return (
		<SimpleBlock className="space-y-4">
			<SimpleTitle>Default settings</SimpleTitle>

			<div className="space-y-4">
				<SimpleField label="Format">
					<select
						value={format}
						onChange={(event) => onFormatChange(event.target.value as OutputFormat)}
						className="w-full border border-border bg-surface px-2 py-2 text-sm text-foreground transition"
					>
						{formatOptions.map((option) => {
							const supported = outputSupport[option.value];
							return (
								<option key={option.value} value={option.value} disabled={!supported}>
									{option.label}
								</option>
							);
						})}
					</select>
				</SimpleField>
				{renderControls()}
			</div>
		</SimpleBlock>
	);
};
