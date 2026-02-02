import clsx from "clsx";
import {
	type ChangeEvent,
	memo,
	type PointerEvent,
	type RefObject,
	useCallback,
	useRef,
	useState,
} from "react";
import { FormatSelector } from "@/components/conversion-item/FormatSelector";
import { SettingsControls } from "@/components/conversion-item/SettingsControls";
import { SimpleTitle } from "@/components/ui/SimpleTitle";
import type {
	BoostSettings,
	GifConversionOptions,
	OutputFormat,
	OutputFormatSupport,
	PngConversionOptions,
} from "@/lib/imageConversion";

interface FloatingSettingsPanelProps {
	containerRef: RefObject<HTMLDivElement | null>;
	targetFormat: OutputFormat;
	outputSupport: OutputFormatSupport;
	formatDisabled: boolean;
	quality: number;
	qualityDisabled: boolean;
	gifOptions: GifConversionOptions;
	pngOptions: PngConversionOptions;
	boost: BoostSettings;
	settingsDisabled: boolean;
	onFormatChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onQualityChange: (value: number) => void;
	onGifOptionsChange: (options: Partial<GifConversionOptions>) => void;
	onPngOptionsChange: (options: Partial<PngConversionOptions>) => void;
	onBoostChange: (options: Partial<BoostSettings>) => void;
}

export const FloatingSettingsPanel = memo(
	({
		containerRef,
		targetFormat,
		outputSupport,
		formatDisabled,
		quality,
		qualityDisabled,
		gifOptions,
		pngOptions,
		boost,
		settingsDisabled,
		onFormatChange,
		onQualityChange,
		onGifOptionsChange,
		onPngOptionsChange,
		onBoostChange,
	}: FloatingSettingsPanelProps) => {
		const floatingPanelRef = useRef<HTMLDivElement>(null);
		const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
		const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
		const [isDragging, setIsDragging] = useState(false);
		const [isCollapsed, setIsCollapsed] = useState(false);

		const clampValue = useCallback((value: number, min: number, max: number) => {
			if (min > max) return min;
			return Math.min(Math.max(value, min), max);
		}, []);

		const updatePanelPosition = useCallback(
			(clientX: number, clientY: number) => {
				const container = containerRef.current;
				const panel = floatingPanelRef.current;
				const offset = dragOffsetRef.current;
				if (!container || !panel || !offset) return;
				const containerRect = container.getBoundingClientRect();
				const padding = 8;
				const maxX = containerRect.width - panel.offsetWidth - padding;
				const maxY = containerRect.height - panel.offsetHeight - padding;
				const nextX = clientX - containerRect.left - offset.x;
				const nextY = clientY - containerRect.top - offset.y;
				setPanelPosition({
					x: clampValue(nextX, padding, maxX),
					y: clampValue(nextY, padding, maxY),
				});
			},
			[clampValue, containerRef],
		);

		const handlePanelPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) return;
			const panel = floatingPanelRef.current;
			if (!panel) return;
			const panelRect = panel.getBoundingClientRect();
			dragOffsetRef.current = {
				x: event.clientX - panelRect.left,
				y: event.clientY - panelRect.top,
			};
			panel.setPointerCapture(event.pointerId);
			setIsDragging(true);
		}, []);

		const handlePanelPointerMove = useCallback(
			(event: PointerEvent<HTMLDivElement>) => {
				if (!dragOffsetRef.current) return;
				updatePanelPosition(event.clientX, event.clientY);
			},
			[updatePanelPosition],
		);

		const handlePanelPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
			const panel = floatingPanelRef.current;
			if (panel?.hasPointerCapture(event.pointerId)) {
				panel.releasePointerCapture(event.pointerId);
			}
			dragOffsetRef.current = null;
			setIsDragging(false);
		}, []);

		return (
			<div
				ref={floatingPanelRef}
				className="absolute z-40 w-72 max-w-[85vw] pointer-events-auto bg-surface p-2 shadow-lg shadow-gray-950/50 rounded-lg flex flex-col gap-3"
				style={{ left: panelPosition.x, top: panelPosition.y }}
				onPointerMove={handlePanelPointerMove}
				onPointerUp={handlePanelPointerUp}
				onPointerCancel={handlePanelPointerUp}
			>
				<div
					className={clsx("flex items-center justify-between gap-2 text-sm select-none",
						{
						"cursor-grabbing": isDragging,
						"cursor-grab": !isDragging,
					})}
					onPointerDown={handlePanelPointerDown}
				>
					<SimpleTitle as="h4" className="text-base">
						Settings
					</SimpleTitle>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<button
							type="button"
							onClick={() => setIsCollapsed((current) => !current)}
							onPointerDown={(event) => event.stopPropagation()}
							className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent cursor-pointer"
						>
							{isCollapsed ? "Open" : "Close"}
						</button>
					</div>
				</div>

				{isCollapsed ? null : (
					<div className="border-t border-border pt-2 flex flex-col gap-3">
						<FormatSelector
							value={targetFormat}
							outputSupport={outputSupport}
							disabled={formatDisabled}
							onFormatChange={onFormatChange}
						/>

						<SettingsControls
							targetFormat={targetFormat}
							quality={quality}
							qualityDisabled={qualityDisabled}
							gifOptions={gifOptions}
							pngOptions={pngOptions}
							boost={boost}
							settingsDisabled={settingsDisabled}
							onQualityChange={onQualityChange}
							onGifOptionsChange={onGifOptionsChange}
							onPngOptionsChange={onPngOptionsChange}
							onBoostChange={onBoostChange}
						/>
					</div>
				)}
			</div>
		);
	},
);
