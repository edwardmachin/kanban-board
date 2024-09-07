import { useCallback, useRef } from "react";

const useSmoothAutoScroll = (scrollSpeed = 5) => {
	const frameId = useRef<number | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const isScrollingRef = useRef(false);

	const startScrolling = useCallback(
		(direction: "left" | "right") => {
			if (isScrollingRef.current) return;
			isScrollingRef.current = true;

			const scroll = () => {
				const container = containerRef.current;
				if (!container) return;

				container.scrollLeft += direction === "left" ? -scrollSpeed : scrollSpeed;
				frameId.current = requestAnimationFrame(scroll);
			};

			frameId.current = requestAnimationFrame(scroll);
		},
		[scrollSpeed],
	);

	const stopScrolling = useCallback(() => {
		if (frameId.current) {
			cancelAnimationFrame(frameId.current);
			frameId.current = null;
		}
		isScrollingRef.current = false;
	}, []);

	return { containerRef, startScrolling, stopScrolling };
};

export default useSmoothAutoScroll;
