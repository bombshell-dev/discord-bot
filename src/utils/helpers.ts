export function random(arr: unknown[]): typeof arr[number] {
	return arr[Math.floor(Math.random() * arr.length)];
}
