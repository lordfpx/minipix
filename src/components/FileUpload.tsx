import clsx from "clsx";
import { type ChangeEvent, type DragEvent, useState } from "react";
import { SimpleBlock } from "@/components/ui/SimpleBlock";
import { SimpleTitle } from "@/components/ui/SimpleTitle";
import { SUPPORTED_INPUT_MIME_TYPES } from "@/lib/imageConversion";
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "@/lib/uploadLimits";
import { formatBytes } from "@/lib/utils";

interface FileUploadProps {
	onFilesSelected: (files: FileList | null) => void;
	errorMessage?: string | null;
}

export const FileUpload = ({ onFilesSelected, errorMessage }: FileUploadProps) => {
	const [isDragging, setIsDragging] = useState(false);

	const acceptMimeTypes = SUPPORTED_INPUT_MIME_TYPES.join(",");

	const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		onFilesSelected(event.target.files);
		event.target.value = "";
	};

	const onDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragging(false);
		onFilesSelected(event.dataTransfer?.files ?? null);
	};

	return (
		<SimpleBlock className="space-y-3">
			<SimpleTitle>Upload images</SimpleTitle>
			<label
				htmlFor="file-upload"
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={onDrop}
				className={clsx(
					"flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-surface p-4 lg:p-8 text-center text-foreground",
					"hover:border-accent hover:bg-surface-muted transition-colors",
					isDragging && "bg-surface-muted",
				)}
			>
				<input
					id="file-upload"
					type="file"
					multiple
					accept={acceptMimeTypes}
					onChange={onInputChange}
					className="hidden"
				/>
				<p className="text-sm text-muted-foreground font-bold">Drop files here, or click to browse.</p>
				<p className="text-xs text-muted-foreground">
					Allowed formats: jpg, png, gif, svg, webp <br />{formatBytes(MAX_FILE_BYTES)} max per
					image,
					total {formatBytes(MAX_TOTAL_BYTES)}
				</p>
			</label>
			{errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
		</SimpleBlock>
	);
};
