import { TextureManager } from './resources'


export type ViewPort = {
    top: number;
    bottom: number;
    left: number;
    right: number;
}


export interface Drawable {
    draw(ctx: CanvasRenderingContext2D, box: ViewPort, res: TextureManager );
}