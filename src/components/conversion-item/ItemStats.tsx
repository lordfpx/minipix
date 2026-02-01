import { memo } from "react";
import { formatBytes } from "@/lib/utils";

interface ItemStatsProps {
	fileType: string;
	formatLabel: string;
	width?: number;
	height?: number;
	originalSize: number;
	convertedSize: number | null;
	delta: number | null;
	gainRatio: number | null;
}

export const ItemStats = memo(
	({
		fileType,
		formatLabel,
		width,
		height,
		originalSize,
		convertedSize,
		delta,
		gainRatio,
	}: ItemStatsProps) => (
		<div className="w-full border border-border bg-surface p-2 md:p-3 text-sm text-muted-foreground flex gap-6">
			<div className="flex flex-col gap-1 grow">
				<div className="flex justify-between gap-4 md:gap-4">
					<span>Source format</span>
					<span className="font-bold text-foreground">{fileType}</span>
				</div>
				<div className="flex justify-between gap-4 md:gap-5">
					<span>Target format</span>
					<span className="font-bold text-foreground">{formatLabel}</span>
				</div>
				<div className="flex justify-between gap-4 md:gap-5">
					<span>Dimensions</span>
					<span className="font-bold text-foreground">
						{width && height ? `${width} × ${height}px` : "Processing"}
					</span>
				</div>
			</div>

			<div className="flex flex-col gap-1 grow">
				<div className="flex justify-between gap-4 md:gap-5">
					<span>Original size</span>
					<span className="font-bold text-foreground">{formatBytes(originalSize)}</span>
				</div>
				<div className="flex justify-between gap-4 md:gap-5">
					<span>Converted size</span>
					<span className="font-bold text-foreground">
						{convertedSize !== null ? formatBytes(convertedSize) : "—"}
					</span>
				</div>
				{gainRatio !== null && delta !== null ? (
					<div className="flex justify-between gap-4 md:gap-5">
						<span>Savings</span>
						<span className="font-bold text-foreground">
							{formatBytes(delta)} ({gainRatio.toFixed(1)}%)
						</span>
					</div>
				) : null}
			</div>
		</div>
	),
);
