import { useCallback, useEffect, useMemo, useRef } from "react";

interface StarfieldProps {
	speedFactor?: number;
	backgroundColor?: string;
	starColor?: [number, number, number];
	starCount?: number;
	children?: React.ReactNode;
}

const Starfield: React.FC<StarfieldProps> = ({
	speedFactor = 0.05,
	backgroundColor = "black",
	starColor = [255, 255, 255],
	starCount = 2500,
	children,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const dimensionsRef = useRef({ width: 0, height: 0 });

	const starColorString = useMemo(() => `rgb(${starColor.join(",")})`, [starColor]);

	const createStars = useCallback(() => {
		return new Float32Array(starCount * 3).map(() => Math.random() * 1600 - 800);
	}, [starCount]);

	const moveStars = useCallback((stars: Float32Array, distance: number) => {
		for (let i = 2; i < stars.length; i += 3) {
			stars[i] -= distance;
			if (stars[i] <= 1) stars[i] += 1000;
		}
	}, []);

	const drawStars = useCallback(
		(ctx: CanvasRenderingContext2D, stars: Float32Array, width: number, height: number) => {
			const cx = width / 2;
			const cy = height / 2;
			ctx.save();
			ctx.fillStyle = starColorString;
			for (let i = 0; i < stars.length; i += 3) {
				const x = cx + stars[i] / (stars[i + 2] * 0.001);
				const y = cy + stars[i + 1] / (stars[i + 2] * 0.001);
				if (x >= 0 && x < width && y >= 0 && y < height) {
					const d = stars[i + 2] / 1000.0;
					const b = 1 - d * d;
					ctx.globalAlpha = b;
					ctx.fillRect(x, y, 1.5, 1.5);
				}
			}
			ctx.restore();
		},
		[starColorString],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) {
			console.error("Could not get 2d context from canvas element");
			return;
		}

		const updateDimensions = () => {
			const { innerWidth: width, innerHeight: height } = window;
			canvas.width = width;
			canvas.height = height;
			dimensionsRef.current = { width, height };
		};

		updateDimensions();
		const stars = createStars();
		let prevTime = 0;

		const animate = (time: number) => {
			const elapsed = time - prevTime;
			prevTime = time;
			moveStars(stars, elapsed * speedFactor);

			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, dimensionsRef.current.width, dimensionsRef.current.height);

			drawStars(ctx, stars, dimensionsRef.current.width, dimensionsRef.current.height);

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		const handleResize = () => {
			updateDimensions();
		};

		window.addEventListener("resize", handleResize);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener("resize", handleResize);
		};
	}, [backgroundColor, speedFactor, createStars, moveStars, drawStars]);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<canvas
				ref={canvasRef}
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					zIndex: -1,
				}}
			/>
			{children}
		</div>
	);
};

export default Starfield;
