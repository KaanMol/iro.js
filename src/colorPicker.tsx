import { h, Component } from 'preact';

import IroWheel from './ui/wheel';
import IroSlider from './ui/slider';
import IroColor from './color';
import { createWidget } from './util/createWidget';

export interface Props {
  value: string,
  color: any,
  optionalValue?: string
}

export interface State {
  width: any,
  color: any
}

class ColorPicker extends Component<Props, State> {
  private events: object = {};
  private deferredEvents: object = {};
  private colorUpdateActive: boolean = false;
  private colorUpdateSrc: string = null;
  public color: IroColor;
  public layout: Array<any>;
  public static pluginHooks: any;
  public defaultProps: object;
  public el: any;
  public id: string;

  constructor(props: any) {
    super(props, {});
    this.emitHook('init:before');
    this.id = props.id;
    this.color = new IroColor(props.color);
    this.deferredEmit('color:init', this.color, { h: false, s: false, v: false, a: false });
    // Whenever the color changes, update the color wheel
    this.color._onChange = this.updateColor.bind(this);
    // Pass all the props into the component's state,
    // Except we want to add the color object and make sure that refs aren't passed down to children
    this.state = {
      ...props,
      color: this.color,
      ref: undefined,
    };
    this.emitHook('init:state');

    if (props.layout) {
      this.layout = props.layout;
    } else {
      this.layout = [
        {component: IroWheel, options: {}},
        {component: IroSlider, options: {}},
      ];
    }
    this.emitHook('init:after');
  }

  // Public ColorPicker events API

  /**
   * @desc Set a callback function for an event
   * @param {String | Array} eventList event(s) to listen to
   * @param {Function} callback
   */
  public on(eventList: any, callback: any) {
    const events = this.events;
    // eventList can be an eventType string or an array of eventType strings
    (!Array.isArray(eventList) ? [eventList] : eventList).forEach(eventType => {
      // Emit plugin hook
      this.emitHook('event:on', eventType, callback);
      // Add event callback
      (events[eventType] || (events[eventType] = [])).push(callback);
      // Call deferred events
      // These are events that can be stored until a listener for them is added
      if (this.deferredEvents[eventType]) {
        // Deffered events store an array of arguments from when the event was called
        this.deferredEvents[eventType].forEach(args => {
          callback.apply(null, args); 
        });
        // Clear deferred events
        this.deferredEvents[eventType] = [];
      }
    });
  }

  /**
   * @desc Remove a callback function for an event added with on()
   * @param {String | Array} eventList The name of the event
   * @param {Function} callback
   */
  public off(eventList: Array<string>|string, callback: () => void) {
    (!Array.isArray(eventList) ? [eventList] : eventList).forEach(eventType => {
      const callbackList = this.events[eventType];
      this.emitHook('event:off', eventType, callback);
      if (callbackList) callbackList.splice(callbackList.indexOf(callback), 1);
    });
  }

  /**
   * @desc Emit an event
   * @param {String} eventType The name of the event to emit
   * @param {Array} args array of args to pass to callbacks
   */
  public emit(eventType: string, ...args: Array<any>) {
    // Events are plugin hooks too
    this.emitHook(eventType, ...args);
    const callbackList = this.events[eventType] || [];
    for (let i = 0; i < callbackList.length; i++) {
      callbackList[i].apply(this, args); 
    }
  }

  /**
   * @desc Emit an event now, or save it for when the relevent event listener is added
   * @param {String} eventType The name of the event to emit
   * @param {Array} args array of args to pass to callbacks
   */
  deferredEmit(eventType: string, ...args: Array<any>) {
    const deferredEvents = this.deferredEvents;
    this.emit(eventType, ...args);
    (deferredEvents[eventType] || (deferredEvents[eventType] = [])).push(args);
  }

  // Public utility methods

  /**
   * @desc Resize the color picker
   * @param {Number} width
   */
  public resize(width: any) {
    this.setState({width}, ()=>{});
  }

  /**
   * @desc Reset the color picker to the initial color provided in the color picker options
   */
  reset() {
    this.color.set(this.props.color);
  }

  // Plugin hooks API

  /**
   * @desc Set a callback function for a hook
   * @param {String} hookType The name of the hook to listen to
   * @param {Function} callback
   */
  public static addHook(hookType: string, callback: () => void) {
    const pluginHooks = ColorPicker.pluginHooks;
    (pluginHooks[hookType] || (pluginHooks[hookType] = [])).push(callback);
  }

  /**
   * @desc Emit a callback hook
   * @access private
   * @param {String} hookType The type of hook event to emit
   */
  private emitHook(hookType: string, ...args: any) {
    const callbackList = ColorPicker.pluginHooks[hookType] || [];
    for (let i = 0; i < callbackList.length; i++) {
      callbackList[i].apply(this, args); 
    }
  }

  // Internal methods

  /**
   * @desc Called by the createWidget wrapper when the element is mounted into the page
   * @access private
   * @param {Element} container the container element for this ColorPicker instance
   */
  private onMount(container: any) {
    this.el = container;
    this.deferredEmit('mount', this);
  }

  /**
   * @desc React to a color update
   * @access private
   * @param {IroColor} color current color
   * @param {Object} changes shows which h,s,v color channels changed
   */
  private updateColor(color: any, changes: any) {
    this.emitHook('color:beforeUpdate', color, changes);
    this.setState({ "color": color });
    this.emitHook('color:afterUpdate', color, changes);
    // Prevent infinite loops if the color is set inside a color:change or input:change callback
    if (!this.colorUpdateActive) {
      // While _colorUpdateActive == true, branch cannot be entered
      this.colorUpdateActive = true;
      // If the color change originates from user input, fire input:change
      if (this.colorUpdateSrc == 'input') { // colorUpdateSrc is cleared in handeInput()
        this.emit('input:change', color, changes);
      } 
      // Always fire color:change event
      this.emit('color:change', color, changes);
      this.colorUpdateActive = false;
    }
  }

  /**
   * @desc Handle input from a UI control element
   * @access private
   * @param {String} type "START" | "MOVE" | "END"
   * @param {Object} hsv new hsv values for the color
   */
  handleInput(type: any, hsv: any) {
    // Fire input start and move events before color update
    if (type === 'START') this.emit('input:start', [this.color]);
    if (type === 'MOVE') this.emit('input:move', this.color);
    // Set the color update source
    this.colorUpdateSrc = 'input';
    // Setting the color HSV here will automatically update the UI
    // Since we bound the color's _onChange callback
    this.color.hsv = hsv;
    // Fire input end event after color update
    if (type === 'END') this.emit('input:end', this.color);
    // Reset color update source so it doesn't interfere with future color updates
    // Super important to do this here and not in updateColor()
    this.colorUpdateSrc = null;
  }

  // componentDidMount() {}

  public render(props: any, state: any) {
    return (
      <div 
        class="iro__colorPicker"
        id={ props.id }
        style={{
          display: state.display,
          width: state.width
        }}
      >
        {this.layout.map(({component: UiComponent, options: options}) => (
          <UiComponent
            {...state}
            {...options}
            onInput={ (type, hsv) => this.handleInput(type, hsv) }
            parent={ this }
          />
        ))}
      </div>
    )
  }
}

ColorPicker.pluginHooks = {
  width: 300,
  height: 300,
  handleRadius: 8,
  handleSvg: null,
  handleOrigin: {x: 0, y: 0},
  color: '#fff',
  borderColor: '#fff',
  borderWidth: 0,
  display: 'block',
  id: null,
  wheelLightness: true,
  wheelAngle: 0,
  wheelDirection: 'anticlockwise',
  sliderHeight: null,
  sliderMargin: 12,
  padding: 6,
  layout: null
}

export default createWidget(ColorPicker);
