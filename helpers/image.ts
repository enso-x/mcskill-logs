export const loadImageAsBase64 = (imageUrl: string): Promise<string | null> => new Promise(async (resolve) => {
	if (!imageUrl) {
		resolve(null);
	}

	const reader = new FileReader();
	const imageBlob = await fetch(imageUrl).then(res => res.blob());

	reader.onload = () => {
		resolve(reader.result as string);
	};
	reader.onerror = () => {
		resolve(null);
	};

	reader.readAsDataURL(imageBlob);
});

export const getImageFromBase64 = (base64: string): Promise<HTMLImageElement | null> => new Promise((resolve) => {
	if (!base64 || !base64.length) {
		resolve(null);
	}

	const image = new Image();

	image.onload = () => {
		resolve(image);
	};
	image.onerror = () => {
		resolve(null);
	};

	image.src = base64;
});

export const getImage2DContext = (image: HTMLImageElement): Promise<CanvasRenderingContext2D | null> => new Promise((resolve) => {
	if (!image) {
		resolve(null);
	}

	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;

	const ctx = canvas.getContext('2d');

	if (ctx) {
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(image, 0, 0, image.width, image.height);

		resolve(ctx);
	}

	resolve(null);
});
