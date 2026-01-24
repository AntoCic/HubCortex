/**
 * rallenta qualche function async per test.
 * @returns void.
 */
export async function delay(millis: number) {
    return await new Promise(resolve => setTimeout(resolve, millis))
}