PYTHON ?= python
BROWSERIFY ?= ./node_modules/.bin/browserify

TEXTURE_SOURCES := $(wildcard img-src/*.xcf)
TEXTURES := $(patsubst img-src/%.xcf,www/img/%.png,$(TEXTURE_SOURCES))

JS_SOURCES := $(wildcard js-src/*.js)
JS_MAIN := js-src/main.js
JS_OUT := www/js/main.js

OUTPUT_DIRS := www/img www/js

.PHONY: all
all: $(TEXTURES) $(JS_OUT)

$(TEXTURES) : www/img/%.png : img-src/%.xcf www/img
	$(PYTHON) ./xcf2png.py $< $@

$(JS_OUT) : $(JS_SOURCES) www/js
	$(BROWSERIFY) --debug -o $(JS_OUT) $(JS_MAIN)

$(OUTPUT_DIRS):
	mkdir -p $@

clean:
	rm -f $(TEXTURES)
