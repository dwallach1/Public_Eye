# -*- coding: utf-8 -*-


def unicodetoascii(text):

    uni2ascii = {
            ord('\xe2\x80\x99'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\x9c'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9d'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9e'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9f'.decode('utf-8')): ord('"'),
            ord('\xc3\xa9'.decode('utf-8')): ord('e'),
            ord('\xe2\x80\x9c'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x93'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x92'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x94'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x94'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x98'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\x9b'.decode('utf-8')): ord("'"),

            ord('\xe2\x80\x90'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x91'.decode('utf-8')): ord('-'),

            ord('\xe2\x80\xb2'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb3'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb4'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb5'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb6'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb7'.decode('utf-8')): ord("'"),

            ord('\xe2\x81\xba'.decode('utf-8')): ord("+"),
            ord('\xe2\x81\xbb'.decode('utf-8')): ord("-"),
            ord('\xe2\x81\xbc'.decode('utf-8')): ord("="),
            ord('\xe2\x81\xbd'.decode('utf-8')): ord("("),
            ord('\xe2\x81\xbe'.decode('utf-8')): ord(")"),
            # ord('u\xa0'.decode('utf-8')): ord(" "),

   		}
    
    return text.decode('utf-8').translate(uni2ascii).encode('ascii')


s = " Meanwhile Plank will continue his agitations small and large to support the entwined futures of Under Armour and the city of Baltimore. “It is really hard work, it’s really dangerous investing, it’s really costly, and it’s a really big deal—but I think it’s the right thing to do,” he says. “What I really want to do in life is to build the baddest brand on the planet. I would love to do that at the same time as anchoring it in a city that could really use a hug. It seems like such a waste for us not to take advantage of the momentum that Under Armour has right now.” "

x = unicodetoascii(s)

tokens = x.strip().split()

#print x
#print tokens


url = "http://www.adweek.com/core/wp-content/uploads/2017/02/UAPage-paper-2017-1.jpg"
i = len(url) - 3
print url[i:]

print url[i:] == "jpg"

