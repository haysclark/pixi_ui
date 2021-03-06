/**
 * @author Andreas Bresser
 */

/**
 * The ScrollArea hosts some content that can be scrolled. The width/height
 * of the ScrollArea defines the viewport.
 *
 * @class ScrollArea
 * @constructor
 */
PIXI_UI.ScrollArea = function(content, addListener, scrolldelta) {
    this.addListener = addListener || true;
    PIXI_UI.Control.call(this);
    this.content = content || null;
    this.mask = undefined;
    this.enabled = true;
    this._useMask = true;

    this.scrolldirection = PIXI_UI.ScrollArea.SCROLL_AUTO;
    // # of pixel you scroll at a time (if the event delta is 1 / -1)
    this.scrolldelta = scrolldelta || 10;

    this.interactive = true;

    this.touchend = this.touchendoutside = this.mouseupoutside = this.mouseup;
    this.touchstart = this.mousedown;
    this.touchmove = this.mousemove;
};

PIXI_UI.ScrollArea.prototype = Object.create( PIXI_UI.Control.prototype );
PIXI_UI.ScrollArea.prototype.constructor = PIXI_UI.ScrollArea;

// scrolls horizontal as default, but will change if a
// horizontal layout is set in the content
PIXI_UI.ScrollArea.SCROLL_AUTO = 'auto';
PIXI_UI.ScrollArea.SCROLL_VERTICAL = 'vertical';
PIXI_UI.ScrollArea.SCROLL_HORIZONTAL = 'horizontal';

/**
 * check, if the layout of the content is horizontally alligned
 *
 * * @method layoutHorizontalAlign
 */
PIXI_UI.ScrollArea.prototype.layoutHorizontalAlign = function() {
    return this.content.layout &&
        this.content.layout.alignment === PIXI_UI.LayoutAlignment.HORIZONTAL_ALIGNMENT;
};

/**
 * test if content width bigger than this width but content height is
 * smaller than this height (so we allow scrolling in only one direction)
 *
 * @method upright
 */
PIXI_UI.ScrollArea.prototype.upright = function() {
    return this.content.height <= this.height &&
        this.content.width > this.width;
};

/**
 * set content (will determine scrll direction automatically if it is a
 * PIXI_UI.ScrollArea, will assume vertical scrolling as default)
 *
 * @method _scrollContent
 */
PIXI_UI.ScrollArea.prototype._scrollContent = function(x, y) {
    // todo: press shift to switch direction
    var scrollAuto = this.scrolldirection === PIXI_UI.ScrollArea.SCROLL_AUTO;
    var scroll = PIXI_UI.ScrollArea.SCROLL_VERTICAL;
    // if the scroll direction is set to SCROLL_AUTO we check, if the
    // layout of the content is set to horizontal or the content
    // width is bigger than the current
    if (this.scrolldirection === PIXI_UI.ScrollArea.SCROLL_HORIZONTAL ||
        (scrollAuto && (this.layoutHorizontalAlign() || this.upright()) )) {
        scroll = PIXI_UI.ScrollArea.SCROLL_HORIZONTAL;
    }
    if (scroll === PIXI_UI.ScrollArea.SCROLL_HORIZONTAL) {
        if (this.content.width > this.width) {
            // assure we are within bounds
            x = Math.min(x, 0);
            if (this.content.width) {
                x = Math.max(x, -(this.content.width - this.width));
            }
            this.content.x = Math.floor(x);
        }
    }
    if (scroll === PIXI_UI.ScrollArea.SCROLL_VERTICAL) {
        if (this.content.height > this.height) {
            // assure we are within bounds
            y = Math.min(y, 0);
            if (this.content.height && this.content.y < 0) {
                y = Math.max(y, -(this.content.height - this.height));
            }
            this.content.y = Math.floor(y);
        }
    }
};

/**
 * mouse button pressed / touch start
 *
 * @method mousedown
 */
PIXI_UI.ScrollArea.prototype.mousedown = function(mouseData) {
    var pos = mouseData.getLocalPosition(this);
    if (!this._start) {
        this._start = [
            pos.x - this.content.x,
            pos.y - this.content.y
        ];
    }
};

/**
 * mouse/finger moved
 *
 * @method mousemove
 */
PIXI_UI.ScrollArea.prototype.mousemove = function(mouseData) {
    if (this._start) {
        var pos = mouseData.getLocalPosition(this);
        this._scrollContent(
            pos.x - this._start[0],
            pos.y - this._start[1]
        );
    }
};

/**
 * mouse up/touch end
 *
 * @method mouseup
 */
PIXI_UI.ScrollArea.prototype.mouseup = function() {
    this._start = null;
};


/**
 * do not remove children - we just have a content
 * override addChild to prevent the developer from adding more than one context
 * @param child
 */
/*
PIXI_UI.ScrollArea.prototype.removeChild = function(child) {
    throw new Error('use .content = null instead of removeChild(child)')
};

PIXI_UI.ScrollArea.prototype.addChild = function(child) {
    throw new Error('use .content = child instead of addChild(child)')
};
*/

/**
 * create a new mask or redraw it
 * @method updateMask
 */
PIXI_UI.ScrollArea.prototype.updateMask = function() {
    if (this.height && this.width && this._useMask) {
        if (this.mask === undefined) {
            this.mask = new PIXI.Graphics();
        }
        this.drawMask();
    } else {
        if (this.mask) {
            this.mask.clear();
        }
        this.mask = undefined;
    }
};

/**
 * draw mask (can be overwritten, e.g. to show something above the
 * scroll area when using a vertical layout)
 * @private
 * @method drawMask
 */
PIXI_UI.ScrollArea.prototype.drawMask = function() {
    var pos = new PIXI.Point(0, 0);
    var global = this.toGlobal(pos);
    this.mask.clear()
        .beginFill('#fff', 1)
        .drawRect(global.x, global.y, this.width, this.height)
        .endFill();
    if (this.hitArea) {
        this.hitArea.width = this.width;
        this.hitArea.height = this.height;
    } else {
        this.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
    }
};

/**
 * Renders the object using the WebGL renderer
 *
 * @method _renderWebGL
 * @param renderSession {RenderSession}
 * @private
 */
/* istanbul ignore next */
PIXI_UI.ScrollArea.prototype._renderWebGL = function(renderSession)
{
    if(!this.visible || this.alpha <= 0)return;

    if(this._cacheAsBitmap)
    {
        this._renderCachedSprite(renderSession);
        return;
    }

    this.redraw();

    var i, j, child;

    if(this._mask || this._filters)
    {

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if(this._filters)
        {
            renderSession.spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._filterBlock);
        }

        if(this._mask)
        {
            renderSession.spriteBatch.stop();
            renderSession.maskManager.pushMask(this.mask, renderSession);
            renderSession.spriteBatch.start();
        }

        // simple render children!
        for(i=0,j=this.children.length; i<j; i++)
        {
            child = this.children[i];
            if (child._renderAreaWebGL) {
                child._renderAreaWebGL(renderSession, -this.content.x, -this.content.y, this.width, this.height);
            } else {
                child._renderWebGL(renderSession);
            }
        }

        renderSession.spriteBatch.stop();

        if(this._mask)renderSession.maskManager.popMask(this._mask, renderSession);
        if(this._filters)renderSession.filterManager.popFilter();

        renderSession.spriteBatch.start();
    }
    else
    {
        // simple render children!
        for(i=0,j=this.children.length; i<j; i++)
        {
            child = this.children[i];
            if (child._renderAreaWebGL) {
                child._renderAreaWebGL(renderSession, -this.content.x, -this.content.y, this.width, this.height);
            } else {
                child._renderWebGL(renderSession);
            }
        }
    }
};

/**
 * Renders the object using the Canvas renderer
 *
 * @method _renderCanvas
 * @param renderSession {RenderSession}
 * @private
 */
/* istanbul ignore next */
PIXI_UI.ScrollArea.prototype._renderCanvas = function(renderSession)
{
    if(this.visible === false || this.alpha === 0)return;

    if(this._cacheAsBitmap)
    {

        this._renderCachedSprite(renderSession);
        return;
    }

    this.redraw();

    if(this._mask)
    {
        renderSession.maskManager.pushMask(this._mask, renderSession);
    }

    for(var i=0,j=this.children.length; i<j; i++)
    {
        var child = this.children[i];
        if (child._renderAreaCanvas) {
            child._renderAreaCanvas(renderSession, -this.content.x, -this.content.y, this.width, this.height);
        } else {
            child._renderCanvas(renderSession);
        }
    }

    if(this._mask)
    {
        renderSession.maskManager.popMask(renderSession);
    }
};

PIXI_UI.ScrollArea.prototype.redraw = function() {
    if (this.invalid) {
        this.updateMask();
        this.invalid = false;
    }
};


Object.defineProperty(PIXI_UI.ScrollArea.prototype, 'content', {
    set: function(content) {
        if (this._content) {
            this.removeChild(content);
        }
        this._content = content;
        if (content) {
            this.addChild(content);
        }
    },
    get: function() {
        return this._content;
    }
});


/**
 * The width of the ScrollArea (defines the viewport)
 *
 * @property width
 * @type Number
 */
Object.defineProperty(PIXI_UI.ScrollArea.prototype, 'width', {
    get: function() {
        if (!this._width) {
            return this._content.width;
        }
        return this._width;
    },
    set: function(width) {
        this._width = width;
        this.invalid = true;
    }
});

/**
 * The height of the ScrollArea (defines the viewport)
 *
 * @property height
 * @type Number
 */
Object.defineProperty(PIXI_UI.ScrollArea.prototype, 'height', {
    get: function() {
        if (!this._height) {
            return this._content.height;
        }
        return this._height;
    },
    set: function(height) {
        this._height = height;
        this.invalid = true;
    }
});
