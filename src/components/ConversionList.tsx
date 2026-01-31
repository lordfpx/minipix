import { ConversionItem } from "@/components/ConversionItem";
import { SimpleBlock } from "@/components/ui/SimpleBlock";
import type {
	GifConversionOptions,
	OutputFormat,
	OutputFormatSupport,
	PngConversionOptions,
} from "@/lib/imageConversion";
import type { ConversionItem as ConversionItemType } from "@/types/conversion";

interface ConversionListProps {
	items: ConversionItemType[];
	outputSupport: OutputFormatSupport;
	globalFormat: OutputFormat;
	onFormatChange: (id: string, format: OutputFormat) => void;
	onQualityChange: (id: string, value: number) => void;
	onUseGlobalSettingsChange: (id: string, useGlobal: boolean) => void;
	onGifOptionsChange: (id: string, options: Partial<GifConversionOptions>) => void;
	onPngOptionsChange: (id: string, options: Partial<PngConversionOptions>) => void;
	onBoostChange: (id: string, options: Partial<ConversionItemType["boost"]>) => void;
	onSplitChange: (id: string, value: number) => void;
	onRemove: (id: string) => void;
}

export const ConversionList = ({
	items,
	outputSupport,
	globalFormat,
	onFormatChange,
	onQualityChange,
	onUseGlobalSettingsChange,
	onGifOptionsChange,
	onPngOptionsChange,
	onBoostChange,
	onSplitChange,
	onRemove,
}: ConversionListProps) => {
	if (items.length === 0) {
		return (
			<SimpleBlock className="ConversionList mb-4">
				<p className="text-sm text-muted-foreground text-center font-bold">
					Upload an image to start the conversion.
				</p>
			</SimpleBlock>
		);
	}

	return (
		<>
			{items.map((item) => (
				<ConversionItem
					key={item.id}
					item={item}
					outputSupport={outputSupport}
					globalFormat={globalFormat}
					onFormatChange={onFormatChange}
					onQualityChange={onQualityChange}
					onUseGlobalSettingsChange={onUseGlobalSettingsChange}
					onGifOptionsChange={onGifOptionsChange}
					onPngOptionsChange={onPngOptionsChange}
					onBoostChange={onBoostChange}
					onSplitChange={onSplitChange}
					onRemove={onRemove}
				/>
			))}
		</>
	);
};
