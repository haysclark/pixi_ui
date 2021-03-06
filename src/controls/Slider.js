/**
 * authors: Björn Friedrichs, Andreas Bresser
 */

PIXI_UI.Slider = function(theme) {
    this.skinName = this.skinName || PIXI_UI.Slider.SKIN_NAME;

    this._minimum = this._minimum || 0;
    this._maximum = this._maximum || 100;
    this.step = this.step || 0; //TODO: implement me!
    this.page = this.page || 10;
    this._value = this.minimum;
    this.change = null;

    PIXI_UI.Scrollable.call(this, theme);
};

PIXI_UI.Slider.prototype = Object.create( PIXI_UI.Scrollable.prototype );
PIXI_UI.Slider.prototype.constructor = PIXI_UI.Slider;

PIXI_UI.Slider.SKIN_NAME = 'scroll_bar';

/**
 * thumb has been moved - calculate new value
 * @param x x-position to scroll to (ignored when vertical)
 * @param y y-position to scroll to (ignored when horizontal)
 */
PIXI_UI.Slider.prototype.thumbMoved = function(x, y) {
    var max = 1, value = 0;
    if (this.orientation === PIXI_UI.Scrollable.HORIZONTAL) {
        max = this.width - this.thumb.width;
        if (this._inverse) {
            value = max - x;
        } else {
            value = x;
        }
    } else {
        max = this.height - this.thumb.height;
        if (this._inverse) {
            value = max - y;
        } else {
            value = y;
        }
    }
    value = value / max * (this.maximum - this.minimum) + this.minimum;
    this.value = value;
};

/**
 * value changed
 */
Object.defineProperty(PIXI_UI.Slider.prototype, 'value', {
    get: function() {
        return this._value;
    },
    set: function(value) {
        value = Math.min(value, this.maximum);
        value = Math.max(value, this.minimum);
        this._value = value;
        if (this.change) {
            var sliderData = new PIXI_UI.SliderData();
            sliderData.value = this._value;
            sliderData.target = this;
            this.change(sliderData);
        }
    }
});

/**
 * set minimum and update value if necessary
 */
Object.defineProperty(PIXI_UI.Slider.prototype, 'minimum', {
    get: function() {
        return this._minimum;
    },
    set: function(minimum) {
        if(!isNaN(minimum) && this.minimum !== minimum && minimum < this.maximum) {
            this._minimum = minimum;
        }
        if (this._value < this.minimum) {
            this.value = this._value;
        }
    }
});

/**
 * set maximum and update value if necessary
 */
Object.defineProperty(PIXI_UI.Slider.prototype, 'maximum', {
    get: function() {
        return this._maximum;
    },
    set: function(maximum) {
        if(!isNaN(maximum) && this.maximum !== maximum && maximum > this.minimum) {
            this._maximum = maximum;
        }
        if (this._value > this.maximum) {
            this.value = maximum;
        }
    }
});
