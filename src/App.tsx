import { ConversionList } from "@/components/ConversionList";
import { ConversionProgressBar } from "@/components/ConversionProgressBar";
import { ConversionStats } from "@/components/ConversionStats";
import { FileUpload } from "@/components/FileUpload";
import { GlobalQualityControl } from "@/components/GlobalQualityControl";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useConversionController } from "@/hooks/useConversionController";
// import { ColorPalettePreview } from "./components/dev/ColorPalettePreview";

const App = () => {
	const {
		items,
		outputSupport,
		globalFormat,
		globalQuality,
		globalGifOptions,
		globalPngOptions,
		averageReduction,
		conversionProgress,
		uploadError,
		hasItems,
		hasDownloadableItems,
		isExporting,
		handleFiles,
		handleFormatChange,
		handleQualityChange,
		handleUseGlobalSettingsChange,
		handleGifOptionsChange,
		handlePngOptionsChange,
		handleBoostChange,
		handleGlobalQualityChange,
		handleGlobalFormatChange,
		handleGlobalGifOptionsChange,
		handleGlobalPngOptionsChange,
		handleSplitChange,
		removeItem,
		clearAll,
		downloadAll,
	} = useConversionController();

	const fallbackOriginalTotal = items.reduce((acc, item) => acc + item.originalSize, 0);
	const fallbackConvertedTotal = items.reduce(
		(acc, item) => acc + (item.convertedBlob?.size ?? 0),
		0,
	);
	const fallbackDelta = fallbackOriginalTotal - fallbackConvertedTotal;
	const fallbackRatio =
		fallbackOriginalTotal > 0 ? (fallbackDelta / fallbackOriginalTotal) * 100 : 0;
	const summaryData = averageReduction ?? {
		originalTotal: fallbackOriginalTotal,
		convertedTotal: fallbackConvertedTotal,
		delta: fallbackDelta,
		ratio: fallbackRatio,
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Header
				onClearAll={clearAll}
				onDownloadAll={downloadAll}
				hasItems={hasItems}
				hasDownloadableItems={hasDownloadableItems}
				isExporting={isExporting}
			/>

			<main className="flex flex-1 flex-col gap-4 mb-6">
				<div className="mx-auto max-w-5xl px-2 py-2 md:py-4 lg:py-6 w-full flex flex-col gap-2 md:gap-4 lg:gap-6">
					<p className="text-foreground text-center">
						This application converts images between different formats and allows you to compare
						before and after conversion.
					</p>

					<div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 lg:gap-6">
						<FileUpload onFilesSelected={handleFiles} errorMessage={uploadError} />

						<GlobalQualityControl
							format={globalFormat}
							outputSupport={outputSupport}
							onFormatChange={handleGlobalFormatChange}
							quality={globalQuality}
							onQualityChange={handleGlobalQualityChange}
							gifOptions={globalGifOptions}
							pngOptions={globalPngOptions}
							onGifOptionsChange={handleGlobalGifOptionsChange}
							onPngOptionsChange={handleGlobalPngOptionsChange}
						/>
					</div>

					<ConversionStats
						originalTotal={summaryData.originalTotal}
						convertedTotal={summaryData.convertedTotal}
						delta={summaryData.delta}
						ratio={summaryData.ratio}
					/>
				</div>

				<section className="flex flex-col gap-4">
					<ConversionList
						items={items}
						outputSupport={outputSupport}
						globalFormat={globalFormat}
						onFormatChange={handleFormatChange}
						onQualityChange={handleQualityChange}
						onUseGlobalSettingsChange={handleUseGlobalSettingsChange}
						onGifOptionsChange={handleGifOptionsChange}
						onPngOptionsChange={handlePngOptionsChange}
						onBoostChange={handleBoostChange}
						onSplitChange={handleSplitChange}
						onRemove={removeItem}
					/>
				</section>
			</main>

			{/* <ColorPalettePreview /> */}

			<Footer />

			{conversionProgress ? (
				<ConversionProgressBar
					value={conversionProgress.value}
					completed={conversionProgress.completed}
					total={conversionProgress.total}
					isActive={conversionProgress.isActive}
				/>
			) : null}
		</div>
	);
};

export default App;
