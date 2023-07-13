/* eslint-disable */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MasonryLayout from 'masonry-layout';
import imagesloaded from 'imagesloaded';
import elementResizeDetectorMaker from 'element-resize-detector';
import debounce from 'lodash/debounce';
import omit from 'lodash/omit';

const propTypes = {
  enableResizableChildren: PropTypes.bool,
  disableImagesLoaded: PropTypes.bool,
  onImagesLoaded: PropTypes.func,
  updateOnEachImageLoad: PropTypes.bool,
  options: PropTypes.object,
  imagesLoadedOptions: PropTypes.object,
  elementType: PropTypes.string,
  onLayoutComplete: PropTypes.func,
  onRemoveComplete: PropTypes.func
}

class MasonryComponent extends Component {
  constructor(props) {
    super(props);
    this.enableResizableChildren = false;
    this.disableImagesLoaded = false;
    this.updateOnEachImageLoad = false,
    this.options = {},
    this.imagesLoadedOptions = {},
    this.className = '',
    this.elementType = 'div',
    this.onLayoutComplete = () => {},
    this.onRemoveComplete = () => {}
    this.masonryContainer = null;
    this.masonry = null;
    this.latestKnownDomChildren = [];
    this.imagesLoadedCancelRef = null;
    this.erd = null;
  }

  initializeMasonry(force) {
    if (!this.masonry || force) {
      this.masonry = new MasonryLayout(this.masonryContainer, this.props.options);

      if (this.props.onLayoutComplete) {
        this.masonry.on('layoutComplete', this.props.onLayoutComplete);
      }

      if (this.props.onRemoveComplete) {
        this.masonry.on('removeComplete', this.props.onRemoveComplete);
      }

      this.latestKnownDomChildren = this.getCurrentDomChildren();
    }
  }

  getCurrentDomChildren() {
    const node = this.masonryContainer;
    const children = this.props.options.itemSelector ? node.querySelectorAll(this.props.options.itemSelector) : node.children;
    return Array.prototype.slice.call(children);
  }

  diffDomChildren() {
    let forceItemReload = false;

    const knownChildrenStillAttached = this.latestKnownDomChildren.filter((element) => {
      return !!element.parentNode;
    });

    if (knownChildrenStillAttached.length !== this.latestKnownDomChildren.length) {
      forceItemReload = true;
    }

    const currentDomChildren = this.getCurrentDomChildren();

    const removed = knownChildrenStillAttached.filter((attachedKnownChild) => {
      return !currentDomChildren.includes(attachedKnownChild);
    });

    const newDomChildren = currentDomChildren.filter((currentChild) => {
      return !knownChildrenStillAttached.includes(currentChild);
    });

    let beginningIndex = 0;

    const prepended = newDomChildren.filter((newChild) => {
      const prepend = (beginningIndex === currentDomChildren.indexOf(newChild));

      if (prepend) {
        beginningIndex++;
      }

      return prepend;
    });

    const appended = newDomChildren.filter((el) => {
      return !prepended.includes(el);
    });

    let moved = [];

    /*
     * This would always be true (see above about the logic for "removed")
     */
    if (removed.length === 0) {
      moved = knownChildrenStillAttached.filter((child, index) => {
        return index !== currentDomChildren.indexOf(child);
      });
    }

    this.latestKnownDomChildren = currentDomChildren;

    return {
      old: knownChildrenStillAttached, // Not used
      new: currentDomChildren, // Not used
      removed: removed,
      appended: appended,
      prepended: prepended,
      moved: moved,
      forceItemReload: forceItemReload
    };
  }

  performLayout() {
    const diff = this.diffDomChildren();
    let reloadItems = diff.forceItemReload || diff.moved.length > 0;

    // Would never be true. (see comments of 'diffDomChildren' about 'removed')
    if (diff.removed.length > 0) {
      if (this.props.enableResizableChildren) {
        diff.removed.forEach(this.erd.removeAllListeners, this.erd);
      }
      this.masonry.remove(diff.removed);
      reloadItems = true;
    }

    if (diff.appended.length > 0) {
      this.masonry.appended(diff.appended);

      if (diff.prepended.length === 0) {
        reloadItems = true;
      }

      if (this.props.enableResizableChildren) {
        diff.appended.forEach(this.listenToElementResize, this);
      }
    }

    if (diff.prepended.length > 0) {
      this.masonry.prepended(diff.prepended);

      if (this.props.enableResizableChildren) {
        diff.prepended.forEach(this.listenToElementResize, this);
      }
    }

    if (reloadItems) {
      this.masonry.reloadItems();
    }

    this.masonry.layout();
  }

  derefImagesLoaded() {
    this.imagesLoadedCancelRef();
    this.imagesLoadedCancelRef = null;
  }

  imagesLoaded() {
    if (this.props.disableImagesLoaded) { return; }

    if (this.imagesLoadedCancelRef) {
      this.derefImagesLoaded();
    }

    const event = this.props.updateOnEachImageLoad ? 'progress' : 'always';
    const handler = debounce(
      function(instance) {
        if (this.props.onImagesLoaded) {
          this.props.onImagesLoaded(instance);
        }
        this.masonry.layout();
      }.bind(this), 100);

    const imgLoad = imagesloaded(this.masonryContainer, this.props.imagesLoadedOptions).on(event, handler);

    this.imagesLoadedCancelRef = function() {
      imgLoad.off(event, handler);
      handler.cancel();
    };
  }

  initializeResizableChildren() {
    if (!this.props.enableResizableChildren) { return; }

    this.erd = elementResizeDetectorMaker({
      strategy: 'scroll'
    });

    this.latestKnownDomChildren.forEach(this.listenToElementResize, this);
  }

  listenToElementResize(el) {
    this.erd.listenTo(el, function() {
      this.masonry.layout()
    }.bind(this))
  }

  destroyErd() {
    if (this.erd) {
      this.latestKnownDomChildren.forEach(this.erd.uninstall, this.erd);
    }
  }

  componentDidMount() {
    this.initializeMasonry();
    this.initializeResizableChildren();
    this.imagesLoaded();
  }

  componentDidUpdate() {
    this.performLayout();
    this.imagesLoaded();
  }

  componentWillUnmount() {
    this.destroyErd();

    // unregister events
    if (this.props.onLayoutComplete) {
      this.masonry.off('layoutComplete', this.props.onLayoutComplete);
    }

    if (this.props.onRemoveComplete) {
      this.masonry.off('removeComplete', this.props.onRemoveComplete);
    }

    if (this.imagesLoadedCancelRef) {
      this.derefImagesLoaded();
    }
    this.masonry.destroy();
  }

  setRef = (n) => {
    this.masonryContainer = n;
  }

  render() {
    const props = omit(this.props, Object.keys(propTypes));
    return (
      <div {...props} ref={this.setRef}>
        {this.props.children}
      </div>
    );
  }
}

export default MasonryComponent;
