// Stub: @noble/hashes not available. Gravatar URL generation is a no-op until
// the dependency is installed.
import type { GravatarOptions } from "./types/gravatar-options"

/**
 * Generate a Gravatar URL for an email address.
 * Currently returns null — requires @noble/hashes for SHA-256 hashing.
 */
export function getGravatarUrl(
    _email?: string | null,
    _options?: GravatarOptions
): string | null {
    return null
}
