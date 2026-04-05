// ----------------------------------
// projects/saasy/apps/web/lib/auth/types/gravatar-options.ts
//
// export type GravatarOptions    L11
// d                              L16
// size                           L20
// jpg                            L25
// forceDefault                   L30
// ----------------------------------

export type GravatarOptions = {
  /**
   * Default image type or URL
   * Options: '404', 'mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank', or custom URL
   */
  d?: string;
  /**
   * Image size in pixels (1-2048)
   */
  size?: number;
  /**
   * Whether to append .jpg extension to the hash
   * @default false
   */
  jpg?: boolean;
  /**
   * Force default image even if user has Gravatar
   * @default false
   */
  forceDefault?: boolean;
};
