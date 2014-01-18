SLD = $(wildcard *.xml)
HTML = $(SLD:.xml=.html)

all: $(HTML) index.html

%.html: %.xml
	./SLDtoHTML.py -s $< > $@

index.html: $(SLD)
	./index.py > index.html

clean:
	rm -f *.html
