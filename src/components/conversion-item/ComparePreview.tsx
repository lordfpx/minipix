import clsx from "clsx";
import { type ChangeEvent, memo, useCallback, useEffect, useRef, useState } from "react";

import { SimpleButton } from "@/components/ui/SimpleButton";
import type { ConversionItem as ConversionItemType, PreviewMode } from "@/types/conversion";

const previewModes: { value: PreviewMode; label: string }[] = [
	{ value: "contain", label: "Fit" },
	{ value: "actual", label: "1x" },
	{ value: "double", label: "2x" },
];

interface ImageFrame {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface ComparePreviewProps {
	originalUrl: string;
	convertedUrl?: string | null;
	compareSplit: number;
	previewMode: PreviewMode;
	status: ConversionItemType["status"];
	error?: string;
	usesGlobalSettings: boolean;
	globalFormatLabel: string;
	onUseGlobalToggle: (event: ChangeEvent<HTMLInputElement>) => void;
	onSplitChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onPreviewModeChange: (mode: PreviewMode) => void;
}

export const ComparePreview = memo(
	({
		originalUrl,
		convertedUrl,
		compareSplit,
		previewMode,
		status,
		error,
		usesGlobalSettings,
		globalFormatLabel,
		onUseGlobalToggle,
		onSplitChange,
		onPreviewModeChange,
	}: ComparePreviewProps) => {
		const contentRef = useRef<HTMLDivElement>(null);
		const baseImageRef = useRef<HTMLImageElement>(null);
		const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
		const [imageFrame, setImageFrame] = useState<ImageFrame>({
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		});

		const syncImageFrame = useCallback(() => {
			const content = contentRef.current;
			const image = baseImageRef.current;
			if (!content || !image) return;

			const contentRect = content.getBoundingClientRect();
			const imageRect = image.getBoundingClientRect();
			const nextFrame = {
				left: imageRect.left - contentRect.left,
				top: imageRect.top - contentRect.top,
				width: imageRect.width,
				height: imageRect.height,
			};

			setImageFrame((prev) =>
				prev.left === nextFrame.left &&
				prev.top === nextFrame.top &&
				prev.width === nextFrame.width &&
				prev.height === nextFrame.height
					? prev
					: nextFrame,
			);
		}, []);

		useEffect(() => {
			const content = contentRef.current;
			const image = baseImageRef.current;
			if (!content || !image) return;

			const frameId = window.requestAnimationFrame(syncImageFrame);
			const observer = new ResizeObserver(() => {
				syncImageFrame();
			});
			observer.observe(content);
			observer.observe(image);

			return () => {
				window.cancelAnimationFrame(frameId);
				observer.disconnect();
			};
		}, [syncImageFrame]);

		const handleBaseImageLoad = () => {
			const image = baseImageRef.current;
			if (!image) return;
			setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
			syncImageFrame();
		};

		const imageScale = previewMode === "double" ? 2 : 1;
		const zoomedImageStyle =
			previewMode !== "contain" && naturalSize
				? {
						width: naturalSize.width * imageScale,
						height: naturalSize.height * imageScale,
					}
				: undefined;
		const contentStyle =
			previewMode !== "contain" && naturalSize
				? {
						width: naturalSize.width * imageScale,
						height: naturalSize.height * imageScale,
					}
				: undefined;

		const imageClassName = clsx("block pixelated pointer-events-none", {
			"h-full w-full object-contain": previewMode === "contain",
			"h-auto w-auto max-w-none max-h-none": previewMode !== "contain",
		});
		const overlayImageClassName = clsx("absolute pixelated pointer-events-none", {
			"h-full w-full object-contain": previewMode === "contain",
			"block max-w-none max-h-none": previewMode !== "contain",
		});
		const hasComparison = Boolean(convertedUrl) && imageFrame.width > 0 && imageFrame.height > 0;
		const dividerLeft = imageFrame.left + (imageFrame.width * compareSplit) / 100;

		return (
			<div className="ComparePreview flex-1 space-y-2 max-sm:-ml-2 max-sm:-mr-2">
				<div className="flex justify-between gap-2 mx-auto max-w-6xl">
					<label className="flex items-center gap-2 text-s border-2 border-accent p-2 rounded-md self-start">
						<input
							type="checkbox"
							checked={usesGlobalSettings}
							onChange={onUseGlobalToggle}
							className="h-4 w-4 border border-border"
						/>
						<b>Use default settings</b> - {globalFormatLabel}
					</label>

					<div className="flex gap-3">
						{previewModes.map((mode) => (
							<SimpleButton
								key={mode.value}
								onClick={() => onPreviewModeChange(mode.value)}
								variant={previewMode === mode.value ? "default" : "outline"}
								className="px-2 py-1 text-xs"
							>
								{mode.label}
							</SimpleButton>
						))}
					</div>
				</div>

				<div className="relative">
					<div className="pointer-events-none absolute inset-2 z-30 flex items-start justify-between gap-2 text-xs text-muted-foreground font-bold">
						<span className="rounded-md bg-background/85 px-2 py-1 shadow-md/40 backdrop-blur-sm">
							Original
						</span>
						{hasComparison ? (
							<span className="rounded-md bg-background/85 px-2 py-1 shadow-md/40 backdrop-blur-sm">
								Converted
							</span>
						) : null}
					</div>

					<div
						className={clsx("flex aspect-square lg:aspect-video overflow-auto bg-surface u-checkboard", {
							"items-center justify-center": previewMode === "contain",
							"items-start justify-start": previewMode !== "contain",
						})}
					>
						<div
							ref={contentRef}
							className={clsx("relative shrink-0", {
								"h-full w-full": previewMode === "contain",
								"m-auto": previewMode !== "contain",
							})}
							style={contentStyle}
						>
							<img
								ref={baseImageRef}
								src={convertedUrl ?? originalUrl}
								alt={convertedUrl ? "Converted" : "Original"}
								loading="lazy"
								onLoad={handleBaseImageLoad}
								className={imageClassName}
								style={zoomedImageStyle}
							/>

							{hasComparison ? (
								<>
									<img
										src={originalUrl}
										alt="Original"
										loading="lazy"
										className={overlayImageClassName}
										style={{
											left: imageFrame.left,
											top: imageFrame.top,
											width: imageFrame.width,
											height: imageFrame.height,
											clipPath: `inset(0 ${100 - compareSplit}% 0 0)`,
										}}
									/>

									<div
										className="pointer-events-none absolute z-20 w-px border-3 border-t-0 border-b-0 border-l-accent border-r-background opacity-70 -translate-x-1/2"
										style={{
											left: dividerLeft,
											top: imageFrame.top,
											height: imageFrame.height,
										}}
									/>

									<input
										type="range"
										min={0}
										max={100}
										value={compareSplit}
										onChange={onSplitChange}
										aria-label="Compare original and converted images"
										className="absolute z-30 opacity-0 cursor-ew-resize"
										style={{
											left: imageFrame.left,
											top: imageFrame.top,
											width: imageFrame.width,
											height: imageFrame.height,
										}}
									/>
								</>
							) : null}
						</div>
					</div>
				</div>

				{status === "error" ? (
					<p className="text-xs text-red-600">{error ?? "Something went wrong."}</p>
				) : null}
			</div>
		);
	},
);
