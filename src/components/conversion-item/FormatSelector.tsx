import { type ChangeEvent, memo } from "react";

import { SimpleField } from "@/components/ui/SimpleField";
import { formatOptions } from "@/types/conversion";
import type { OutputFormat, OutputFormatSupport } from "@/lib/imageConversion";

interface FormatSelectorProps {
	value: OutputFormat;
	outputSupport: OutputFormatSupport;
	disabled: boolean;
	onFormatChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export const FormatSelector = memo(
	({ value, outputSupport, disabled, onFormatChange }: FormatSelectorProps) => (
	<SimpleField label="Format">
		<select
			value={value}
			onChange={onFormatChange}
			disabled={disabled}
			className="w-full border border-border bg-surface px-2 py-2 text-sm text-foreground transition disabled:opacity-60"
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
	),
);
