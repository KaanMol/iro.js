import IroComponent, { EventResult } from './component';
export default class IroSlider extends IroComponent {
    height: number;
    width: number;
    renderGradient(props: any): JSX.Element;
    render(props: any): JSX.Element;
    getValueFromPoint(x: number, y: number, { left }: {
        left: any;
    }): number;
    /**
      * @desc handles mouse input for this component
      * @param {Number} x - point x coordinate
      * @param {Number} y - point y coordinate
      * @param {DOMRect} rect - bounding client rect for the component's base element
      * @param {String} type - input type: "START", "MOVE" or "END"
    */
    handleInput(x: number, y: number, bounds: DOMRect | ClientRect, type: EventResult): void;
}
