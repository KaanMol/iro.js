import { Component } from 'preact';
import { listen, unlisten } from '../util/dom';

enum Event {
  mouseDown = "mousedown",
  mouseMove = "mousemove",
  mouseUp = "mouseup",
  touchStart = "touchstart",
  touchMove = "touchstart",
  TouchEnd = "touchend"
}

export enum EventResult {
  start,
  move,
  end
}

interface Props {
  sliderType: any,
  onInput: any,
  wheelAngle: any,
  wheelDirection: any,
  width: any,
  padding: any,
  handleRadius: any,
  borderWidth: any
}

interface State {

}

/**
 * Base component class for iro UI components
 * This extends the Preact component class to allow them to react to mouse/touch input events by themselves
 */
export default abstract class IroComponent extends Component<Props, State> {
  public uid: string;
  public base: HTMLElement;

  constructor(props: any) {
    super(props, {});
    // Generate unique ID for the component
    // This can be used to generate unique IDs for gradients, etc
    this.uid = (Math.random() + 1).toString(36).substring(5);
  }

  componentDidMount() {
    listen(this.base, [Event.mouseDown, Event.touchStart], this, { passive: false });
  }

  componentWillUnmount() {
    unlisten(this.base, [Event.mouseDown, Event.touchStart], this);
  }



  abstract handleInput(x: number, y: number, bounds: ClientRect | DOMRect, type: EventResult);

  // More info on handleEvent:
  // https://medium.com/@WebReflection/dom-handleevent-a-cross-platform-standard-since-year-2000-5bf17287fd38
  // TL;DR this lets us have a single point of entry for multiple events, and we can avoid callback/binding hell
  handleEvent(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    // Detect if the event is a touch event by checking if it has the `touches` property
    // If it is a touch event, use the first touch input
    const point = e instanceof TouchEvent ? e.changedTouches[0] : e;
    const x = point.clientX;
    const y = point.clientY;

    // Get the screen position of the component
    const bounds = this.base.getBoundingClientRect();

    switch (e.type) {
      case Event.mouseDown:
      case Event.touchStart:
        listen(document, [Event.mouseMove, Event.mouseMove, Event.mouseUp, Event.TouchEnd], this, { passive: false });
        this.handleInput(x, y, bounds, EventResult.start);
        break;
      case Event.mouseMove:
      case Event.touchMove:
        this.handleInput(x, y, bounds, EventResult.move);
        break;
      case Event.mouseUp:
      case Event.TouchEnd:
        this.handleInput(x, y, bounds, EventResult.end);
        unlisten(document, [Event.mouseMove, Event.mouseMove, Event.mouseUp, Event.TouchEnd], this, { passive: false });
        break;
    }
  }


}
