/**
 * Created by sandeepkumar on 16/01/17.
 */
class VFParser {
  constructor() {
    this.self = this;
    this._listeners = {};
    this._mapCdataTags = this.makeMap("script,style");
    this._arrBlocks = [];
    this.lastEvent = null;
  }

  makeMap(str){
    const obj = {};
    const items = str.split(",");
    for ( let i = 0; i < items.length; i++ ){
      obj[ items[i] ] = true;
    }
    return obj;
  };

  parse(html) {
    const self = this;
    const mapCdataTags = self._mapCdataTags;
    const regTag=/<(?:\/([^\s>]+)\s*|!--([\s\S]*?)--|!([^>]*?)|([\w\-:]+)((?:\s+[^\s"'>\/=\x00-\x0F\x7F\x80-\x9F]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]*))?)*?)\s*(\/?))>/g;
    const regAttr = /\s*([^\s"'>\/=\x00-\x0F\x7F\x80-\x9F]+)(?:\s*=\s*(?:(")([^"]*)"|(')([^']*)'|([^\s"'>]*)))?/g;
    const regLine = /\r?\n/g;
    let match;
    let matchIndex;
    let lastIndex = 0;
    let tagName;
    let arrAttrs;
    let tagCDATA;
    let attrsCDATA;
    let arrCDATA;
    let lastCDATAIndex = 0;
    let text;
    let lastLineIndex = 0;
    let line = 1;
    const arrBlocks = self._arrBlocks;

    self.fire('start', {
      pos: 0,
      line: 1,
      col: 1
    });

    while((match = regTag.exec(html))){
      matchIndex = match.index;
      if(matchIndex > lastIndex){//Save the previous text or CDATA
        text = html.substring(lastIndex, matchIndex);
        if(tagCDATA){
          arrCDATA.push(text);
        }
        else{//text
          saveBlock('text', text, lastIndex);
        }
      }
      lastIndex = regTag.lastIndex;

      if((tagName = match[1])){
        if(tagCDATA && tagName === tagCDATA){//End the label before outputting CDATA
          text = arrCDATA.join('');
          saveBlock('cdata', text, lastCDATAIndex, {
            'tagName': tagCDATA,
            'attrs': attrsCDATA
          });
          tagCDATA = null;
          attrsCDATA = null;
          arrCDATA = null;
        }
        if(!tagCDATA){
          //The label ends
          saveBlock('tagend', match[0], matchIndex, {
            'tagName': tagName
          });
          continue;
        }
      }

      if(tagCDATA){
        arrCDATA.push(match[0]);
      }
      else{
        if((tagName = match[4])){
          //The label starts
          arrAttrs = [];
          const attrs = match[5];
          let attrMatch;
          let attrMatchCount = 0;
          while((attrMatch = regAttr.exec(attrs))){
            const name = attrMatch[1];

            const quote = attrMatch[2] ? attrMatch[2] :
              attrMatch[4] ? attrMatch[4] : '';

            const value = attrMatch[3] ? attrMatch[3] :
              attrMatch[5] ? attrMatch[5] :
                attrMatch[6] ? attrMatch[6] : '';

            arrAttrs.push({'name': name, 'value': value, 'quote': quote, 'index': attrMatch.index, 'raw': attrMatch[0]});
            attrMatchCount += attrMatch[0].length;
          }
          if(attrMatchCount === attrs.length){
            saveBlock('tagstart', match[0], matchIndex, {
              'tagName': tagName,
              'attrs': arrAttrs,
              'close': match[6]
            });
            if(mapCdataTags[tagName]){
              tagCDATA = tagName;
              attrsCDATA = arrAttrs.concat();
              arrCDATA = [];
              lastCDATAIndex = lastIndex;
            }
          }
          else{//If a match occurs, match the current content to text
            saveBlock('text', match[0], matchIndex);
          }
        }
        else if(match[2] || match[3]){//Annotation label
          saveBlock('comment', match[0], matchIndex, {
            'content': match[2] || match[3],
            'long': match[2]?true:false
          });
        }
      }
    }

    if(html.length > lastIndex){
      //End text
      text = html.substring(lastIndex, html.length);
      saveBlock('text', text, lastIndex);
    }

    self.fire('end', {
      pos: lastIndex,
      line,
      col: html.length - lastLineIndex + 1
    });

    //Storage block
    function saveBlock(type, raw, pos, data){
      const col = pos - lastLineIndex + 1;
      if(data === undefined){
        data = {};
      }
      data.raw = raw;
      data.pos = pos;
      data.line = line;
      data.col = col;
      arrBlocks.push(data);
      self.fire(type, data);
      let lineMatch;
      while((lineMatch = regLine.exec(raw))){
        line ++;
        lastLineIndex = pos + regLine.lastIndex;
      }
    }
  };

  addListener(types, listener){
    const _listeners = this._listeners;
    const arrTypes = types.split(/[,\s]/);
    let type;
    for(let i=0, l = arrTypes.length;i<l;i++){
      type = arrTypes[i];
      if (_listeners[type] === undefined){
        _listeners[type] = [];
      }
      _listeners[type].push(listener);
    }
  };

  fire(type, data){
    if (data === undefined){
      data = {};
    }
    data.type = type;
    const self = this;
    let listeners = [];
    const listenersType = self._listeners[type];
    const listenersAll = self._listeners['all'];
    if (listenersType !== undefined){
      listeners = listeners.concat(listenersType);
    }
    if (listenersAll !== undefined){
      listeners = listeners.concat(listenersAll);
    }
    const lastEvent = self.lastEvent;
    if(lastEvent !== null){
      delete lastEvent['lastEvent'];
      data.lastEvent = lastEvent;
    }
    self.lastEvent = data;
    for (let i = 0, l = listeners.length; i < l; i++){
      listeners[i].call(self, data);
    }
  };

  removeListener(type, listener){
    const listenersType = this._listeners[type];
    if(listenersType !== undefined){
      for (let i = 0, l = listenersType.length; i < l; i++){
        if (listenersType[i] === listener){
          listenersType.splice(i, 1);
          break;
        }
      }
    }
  };

  fixPos(event, index){
    const text = event.raw.substr(0, index);
    const arrLines = text.split(/\r?\n/);
    const lineCount = arrLines.length - 1;
    let line = event.line;
    let col;
    if(lineCount > 0){
      line += lineCount;
      col = arrLines[lineCount].length + 1;
    }
    else{
      col = event.col + index;
    }
    return {
      line,
      col
    };
  };

  getMapAttrs(arrAttrs){
    const mapAttrs = {};
    let attr;
    for(let i=0, l=arrAttrs.length;i<l;i++){
      attr = arrAttrs[i];
      mapAttrs[attr.name] = attr.value;
    }
    return mapAttrs;
  };
}

export default VFParser;

