const HDR_TRANSFERS = new Set<VideoColorSpaceInit["transfer"]>([
	"smpte2084" as VideoColorSpaceInit["transfer"],
	"arib-std-b67" as VideoColorSpaceInit["transfer"],
]);

const guessMimeType = (file: File) => {
	if (file.type) {
		if (file.type === "image/jpg") return "image/jpeg";
		return file.type;
	}
	const extension = file.name.split(".").pop()?.toLowerCase();
	if (!extension) return null;
	switch (extension) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "avif":
			return "image/avif";
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "gif":
			return "image/gif";
		case "svg":
			return "image/svg+xml";
		case "ico":
			return "image/x-icon";
		default:
			return null;
	}
};

const shouldFlagHdr = (colorSpace?: VideoColorSpace) => {
	if (!colorSpace) return false;
	if (HDR_TRANSFERS.has(colorSpace.transfer)) return true;
	if (
		colorSpace.primaries === ("bt2020" as VideoColorPrimaries) &&
		colorSpace.transfer &&
		colorSpace.transfer !== "bt709"
	) {
		return true;
	}
	return false;
};

const APP1 = 0xe1;
const APP11 = 0xeb;

const MAX_SEGMENT_SCAN = 64 * 1024;
const HDR_SIGNATURES = [
	"hdrgm",
	"hdr gain map",
	"hdrgainmap",
	"gain map 1",
	"gain map 2",
	"hdrgainmaptype",
	"urn:com:apple:photo:hdrgainmap",
	"com.apple.photo.hdrgainmap",
];

const textDecoder = "TextDecoder" in self ? new TextDecoder("latin1") : null;

const segmentContainsHdrSignature = (
	data: ArrayBuffer,
	payloadStart: number,
	payloadEnd: number,
) => {
	const length = payloadEnd - payloadStart;
	const sliceLength = Math.min(length, MAX_SEGMENT_SCAN);
	const bytes = new Uint8Array(data, payloadStart, sliceLength);
	if (textDecoder) {
		const ascii = textDecoder.decode(bytes).toLowerCase();
		return HDR_SIGNATURES.some((sig) => ascii.includes(sig));
	}
	// Fallback: manual scan for "hdrgm" only.
	for (let i = 0; i <= bytes.length - 5; i++) {
		if (
			(bytes[i] | 0x20) === 0x68 && // h/H
			(bytes[i + 1] | 0x20) === 0x64 && // d/D
			(bytes[i + 2] | 0x20) === 0x72 && // r/R
			(bytes[i + 3] | 0x20) === 0x67 && // g/G
			(bytes[i + 4] | 0x20) === 0x6d // m/M
		) {
			return true;
		}
	}
	return false;
};

const hasJpegHdrGainMap = (data: ArrayBuffer, mimeType: string | null) => {
	const view = new DataView(data);
	const length = view.byteLength;
	const isJpeg =
		mimeType?.startsWith("image/jpeg") || (view.byteLength >= 2 && view.getUint16(0) === 0xffd8);
	if (!isJpeg) return false;

	let offset = 2; // skip SOI
	while (offset + 4 <= length) {
		const markerPrefix = view.getUint8(offset);
		if (markerPrefix !== 0xff) {
			offset += 1;
			continue;
		}
		let marker = view.getUint8(offset + 1);
		offset += 2;
		while (marker === 0xff && offset < length) {
			marker = view.getUint8(offset);
			offset += 1;
		}
		if (marker === 0xd9 || marker === 0xda) {
			break; // EOI or SOS
		}
		const segmentLength = view.getUint16(offset);
		offset += 2;
		if (segmentLength < 2 || offset + segmentLength - 2 > length) {
			break;
		}
		const payloadStart = offset;
		const payloadEnd = offset + segmentLength - 2;
		if (marker === APP11 || marker === APP1) {
			if (segmentContainsHdrSignature(data, payloadStart, payloadEnd)) return true;
		}
		offset = payloadEnd;
	}
	// Fallback: broad scan over the first 1.5MB of data.
	const broadScanLength = Math.min(length, 1_500_000);
	const broadSlice = new Uint8Array(data, 0, broadScanLength);
	if (textDecoder) {
		const ascii = textDecoder.decode(broadSlice).toLowerCase();
		if (HDR_SIGNATURES.some((sig) => ascii.includes(sig))) {
			return true;
		}
	} else {
		for (let i = 0; i <= broadSlice.length - 5; i++) {
			if (
				(broadSlice[i] | 0x20) === 0x68 &&
				(broadSlice[i + 1] | 0x20) === 0x64 &&
				(broadSlice[i + 2] | 0x20) === 0x72 &&
				(broadSlice[i + 3] | 0x20) === 0x67 &&
				(broadSlice[i + 4] | 0x20) === 0x6d
			) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Detect if an image file is HDR based on its decoded color space.
 * Falls back to false when the browser lacks ImageDecoder support.
 */
export const detectHdrImage = async (file: File): Promise<boolean> => {
	console.log("[HDR] Start detection for", file.name, "type:", file.type);
	if (typeof ImageDecoder === "undefined") {
		console.log("[HDR] ImageDecoder not available, skipping detection.");
		return false;
	}

	const mimeType = guessMimeType(file);
	if (!mimeType) {
		console.log("[HDR] Unable to guess mime type for", file.name);
		return false;
	}

	const isSupported = await ImageDecoder.isTypeSupported(mimeType).catch(() => false);
	if (!isSupported) {
		console.log("[HDR] Mime type not supported by ImageDecoder", mimeType);
		return false;
	}

	let data: ArrayBuffer | null = null;
	try {
		data = await file.arrayBuffer();
	} catch (error) {
		console.warn("[HDR] Failed to read file into buffer for ImageDecoder", error);
		return false;
	}

	if (hasJpegHdrGainMap(data, mimeType)) {
		console.log("[HDR] Detected Apple gain-map signature in JPEG.");
		return true;
	}

	const decoder = new ImageDecoder({
		data,
		type: mimeType,
		colorSpaceConversion: "none",
	});

	try {
		const trackColorSpace = (() => {
			if (!("tracks" in decoder)) return undefined;
			const tracks = decoder.tracks as unknown as {
				selectedTrack?: { colorSpace?: VideoColorSpace };
				[index: number]: { colorSpace?: VideoColorSpace } | undefined;
			};
			return tracks.selectedTrack?.colorSpace ?? tracks[0]?.colorSpace;
		})();
		if (trackColorSpace && shouldFlagHdr(trackColorSpace)) {
			console.log("[HDR] Flagged via track color space", trackColorSpace);
			decoder.close();
			return true;
		}

		const { image } = await decoder.decode({ frameIndex: 0 });
		const isHdr = shouldFlagHdr(image.colorSpace);
		console.log("[HDR] Decoded color space", image.colorSpace, "HDR?", isHdr);
		image.close();
		decoder.close();
		return isHdr;
	} catch (error) {
		try {
			decoder.close();
		} catch (closeError) {
			console.warn("Failed to close ImageDecoder after HDR detection", closeError);
		}
		console.warn("[HDR] Detection failed", error);
		return false;
	}
};
