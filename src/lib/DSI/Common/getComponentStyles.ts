import type { ComponentParams } from '@sitecore-content-sdk/nextjs';

interface StyleResult {
  id?: string;
  styles: string;
  backgroundStyle: { [key: string]: string };
}

/** Returns the shared identifier, CSS classes, and background style for a DSI rendering. */
export function getComponentStyles(params: ComponentParams): StyleResult {
  // const id = params.RenderingIdentifier;
  const id = params.RenderingIdentifier || params.Id || '';

  const containerStyles = params?.Styles ?? '';
  // If GridParameters is used, it can be appended to styles
  // const styles = `${params?.GridParameters ?? ''} ${containerStyles}`.trimEnd();
  const styles = `${containerStyles}`.trimEnd();

  const mediaUrlPattern = /mediaurl=\"([^"]*)\"/i;
  const backgroundImage = params?.BackgroundImage as string;
  let backgroundStyle: { [key: string]: string } = {};

  if (backgroundImage && mediaUrlPattern.test(backgroundImage)) {
    const mediaUrl = backgroundImage.match(mediaUrlPattern)?.[1] || '';
    backgroundStyle = { backgroundImage: `url('${mediaUrl}')` };
  }

  return { id, styles, backgroundStyle };
}
