export async function sleep(duration: number) {
	const start = Date.now();
	const elapsed = Date.now() - start;

	if (elapsed < duration) {
		await new Promise((resolve) => setTimeout(resolve, duration - elapsed));
	}
}
