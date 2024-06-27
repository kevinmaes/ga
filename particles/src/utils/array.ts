export function removeUndefined<T>(item: T | undefined): item is T {
	return item !== undefined;
}

export function removeNull<T>(item: T | null): item is T {
	return item !== null;
}

export function removeNullOrUndefined<T>(
	item: T | undefined | null
): item is T {
	return removeUndefined(item) && removeNull(item);
}
