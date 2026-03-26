import { type ChangeEvent, memo } from "react";

import { SimpleButton } from "@/components/ui/SimpleButton";
import type { PreviewMode } from "@/types/conversion";

const previewModes: { value: PreviewMode; label: string }[] = [
	{ value: "actual", label: "1x" },
	{ value: "contain", label: "Fit" },
	{ value: "double", label: "2x" },
];

interface PreviewToolbarProps {
	showGlobalSettingsToggle: boolean;
	usesGlobalSettings: boolean;
	globalFormatLabel: string;
	previewMode: PreviewMode;
	onUseGlobalToggle: (event: ChangeEvent<HTMLInputElement>) => void;
	onPreviewModeChange: (mode: PreviewMode) => void;
}

const PreviewToolbarComponent = ({
	showGlobalSettingsToggle,
	usesGlobalSettings,
	globalFormatLabel,
	previewMode,
	onUseGlobalToggle,
	onPreviewModeChange,
}: PreviewToolbarProps) => {
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

			<div className="flex gap-3 ml-auto">
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
			</div>
		</div>
	);
};

export const PreviewToolbar = memo(PreviewToolbarComponent);
