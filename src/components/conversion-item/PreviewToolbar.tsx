import { type ChangeEvent, memo, useEffect, useState } from "react";

import { SimpleButton } from "@/components/ui/SimpleButton";
import type { PreviewMode } from "@/types/conversion";

const previewModes: { value: PreviewMode; label: string }[] = [
	{ value: "actual", label: "1x" },
	{ value: "contain", label: "Fit" },
	{ value: "double", label: "2x" },
	{ value: "custom", label: "Px" },
];

interface PreviewToolbarProps {
	showGlobalSettingsToggle: boolean;
	usesGlobalSettings: boolean;
	globalFormatLabel: string;
	previewMode: PreviewMode;
	previewCustomWidth?: number;
	onUseGlobalToggle: (event: ChangeEvent<HTMLInputElement>) => void;
	onPreviewModeChange: (mode: PreviewMode) => void;
	onPreviewCustomWidthChange: (width?: number) => void;
}

const PreviewToolbarComponent = ({
	showGlobalSettingsToggle,
	usesGlobalSettings,
	globalFormatLabel,
	previewMode,
	previewCustomWidth,
	onUseGlobalToggle,
	onPreviewModeChange,
	onPreviewCustomWidthChange,
}: PreviewToolbarProps) => {
	const [customWidthDraft, setCustomWidthDraft] = useState(
		previewCustomWidth ? String(previewCustomWidth) : "",
	);

	useEffect(() => {
		setCustomWidthDraft(previewCustomWidth ? String(previewCustomWidth) : "");
	}, [previewCustomWidth]);

	const handleCustomWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextValue = event.target.value;
		setCustomWidthDraft(nextValue);

		if (nextValue.trim() === "") {
			onPreviewCustomWidthChange(undefined);
			return;
		}

		const parsedWidth = Number(nextValue);
		if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
			return;
		}

		onPreviewCustomWidthChange(Math.round(parsedWidth));
	};

	return (
		<div className="PreviewToolbarComponent w-full flex justify-between gap-2 mx-auto max-w-6xl">
			{showGlobalSettingsToggle && (
				<label className="flex items-center gap-2 text-s border-2 border-accent p-2 rounded-md self-start">
					<input
						type="checkbox"
						checked={usesGlobalSettings}
						onChange={onUseGlobalToggle}
						className="h-4 w-4 border border-border"
					/>
					<b>Use default settings</b> - {globalFormatLabel}
				</label>
			)}

			<div className="flex flex-wrap items-center justify-end gap-3 ml-auto">
				{previewModes.map((mode) => (
					<SimpleButton
						key={mode.value}
						onClick={() => onPreviewModeChange(mode.value)}
						variant={previewMode === mode.value ? "default" : "outline"}
						className="px-2 py-1 text-s"
					>
						{mode.label}
					</SimpleButton>
				))}

				{previewMode === "custom" ? (
					<label className="flex items-center gap-2 text-s text-muted-foreground">
						<span className="font-semibold">Width</span>
						<input
							type="number"
							min={1}
							step={1}
							inputMode="numeric"
							value={customWidthDraft}
							onChange={handleCustomWidthChange}
							className="w-24 border border-border bg-surface px-2 py-1 text-s text-foreground"
						/>
						<span className="font-semibold">px</span>
					</label>
				) : null}
			</div>
		</div>
	);
};

export const PreviewToolbar = memo(PreviewToolbarComponent);
