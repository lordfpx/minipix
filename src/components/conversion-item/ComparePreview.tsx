import { type ChangeEvent, memo, useState } from "react";

import { ComparePreviewModal } from "@/components/conversion-item/ComparePreviewModal";
import { SimpleButton } from "@/components/ui/SimpleButton";
import type { ConversionItem as ConversionItemType } from "@/types/conversion";

interface ComparePreviewProps {
	originalUrl: string;
	convertedUrl?: string | null;
	compareSplit: number;
	status: ConversionItemType["status"];
	error?: string;
	onSplitChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const ComparePreview = memo(
	({
		originalUrl,
		convertedUrl,
		compareSplit,
		status,
		error,
		onSplitChange,
	}: ComparePreviewProps) => {
		const [activeModal, setActiveModal] = useState<"original" | "converted" | null>(null);

		const openModal = (target: "original" | "converted") => {
			if (target === "converted" && !convertedUrl) return;
			setActiveModal(target);
		};

		const handleDialogOpenChange = (open: boolean) => {
			if (!open) {
				setActiveModal(null);
			}
		};

		const handleModalTargetToggle = () => {
			if (!convertedUrl) return;
			setActiveModal((prev) => (prev === "converted" ? "original" : "converted"));
		};

		return (
			<div className="ComparePreview flex-1 space-y-2 max-sm:-ml-2 max-sm:-mr-2">
				<div className="relative">
					<div className="pointer-events-none absolute z-30 inset-2 flex items-start justify-between text-xs md:text-s text-muted-foreground">
						<SimpleButton
							onClick={() => openModal("original")}
							className="pointer-events-auto shadow-md/50"
						>
							Original
						</SimpleButton>
						<SimpleButton
							onClick={() => openModal("converted")}
							disabled={!convertedUrl}
							className="pointer-events-auto shadow-md/50"
						>
							Converted
						</SimpleButton>
					</div>
					<div className="relative flex aspect-square lg:aspect-video items-center justify-center bg-surface u-checkboard">
						<img
							src={convertedUrl ?? originalUrl}
							alt={convertedUrl ? "Converted" : "Original"}
							loading="lazy"
							className="h-full w-full object-contain pixelated pointer-events-none"
						/>

						{convertedUrl ? (
							<img
								src={originalUrl}
								alt="Original"
								loading="lazy"
								className="absolute inset-0 h-full w-full object-contain pixelated pointer-events-none"
								style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
							/>
						) : null}

						<div
							className="h-full border-2 border-t-0 border-b-0 border-l-foreground border-r-background opacity-50 w-px absolute top-0 bottom-0 translate-x-1/2 transition-transform"
							style={{ left: `${compareSplit}%` }}
						/>
					</div>
					<input
						type="range"
						min={0}
						max={100}
						value={compareSplit}
						onChange={onSplitChange}
						className="absolute inset-0 opacity-0 cursor-ew-resize"
					/>
				</div>

				{status === "error" ? (
					<p className="text-xs text-red-600">{error ?? "Something went wrong."}</p>
				) : null}

				<ComparePreviewModal
					activeModal={activeModal}
					originalUrl={originalUrl}
					convertedUrl={convertedUrl}
					onOpenChange={handleDialogOpenChange}
					onToggleTarget={handleModalTargetToggle}
				/>
			</div>
		);
	},
);
