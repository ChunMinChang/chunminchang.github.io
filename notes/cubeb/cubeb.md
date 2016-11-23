# Cubeb
[cubeb][cubeb_kinetik] is cross platform audio library supporting linux, OS X, windows, and android. Here is [my repo][cubeb_cmc].


## How cubeb works
[cubeb][cubeb_kinetik] provides an __uniform interface__ like ```cubeb_init```, ```cubeb_stream_init```, ```cubeb_stream_start```, or ```cubeb_stream_stop``` on each platform.


## Cubeb Inside

### What is the relationship between Gecko and cubeb

[cubeb][cubeb_kinetik] is imported into [Gecko][gecko] as a library, named [libcubeb][libcubeb]. It will be updated periodically.


### Where is the entry point from Gecko to cubeb
[Gecko][gecko] uses [CubebUtils][cubebutils] to wrap [cubeb library(libcubeb)][libcubeb], and the entry point to creates a cubeb object is in [AudioStream::Init][cubeb-ctx-in-as], where [CubebUtils::GetCubebContext](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/CubebUtils.cpp#142) is fired to call [GetCubebContextUnlocked](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/CubebUtils.cpp#215) to [initialize the cubeb](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/src/cubeb.c#111).

[AudioStream::Init](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.cpp#357) will return [OpenCubeb](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.cpp#361), which takes the cubeb object created from  [cubeb_init][cubeb-ctx-in-as] as a parameter, and [OpenCubeb](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.cpp#370) will call [cubeb_stream_init](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/include/cubeb.h#419) to initialize the [cubeb_stream](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/include/cubeb.h#120) and [save it as its member](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.cpp#374).

#### Why we only use ```cubeb_stream``` as member in ```AudioStream```?
One of a member of ```AudioStream``` is a [unique pointer to ```cubeb_stream```](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.h#290). But, don't we need to track the [created cubeb object][cubeb-ctx-in-as] in ```AudioStream::Init```? Why don't we use ```cubeb``` as member instead of using ```cubeb_stream``` in ```AudioStream```?

The truth is that the [created cubeb object][cubeb-ctx-in-as] is __still kept tracking__. The ```cubeb_stream``` has a [pointer to ```cubeb```](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/src/cubeb.c#24), so it still can be found!

The ```cubeb_stream->context``` will be set in ```cubeb_stream_init```. You can check its code on each platform:

- ```cubeb_stream_init``` on [windows](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/src/cubeb_wasapi.cpp#1628)
- ```cubeb_stream_init``` on [OSX](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/src/cubeb_audiounit.cpp#1142)
- ```cubeb_stream_init``` on [Linux](http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/media/libcubeb/src/cubeb_sndio.c#199)

### How sound played in cubeb
It depends. It has different mechanisms for each platform. Please refer to following topics:

- Windows: How sound played in WAS API
- Linux: How sound played in PulseAudio
- OS X: How sound played in AudioUnit

### Terms
- capture stream: input stream
- render stream: output stream
- channel layout
- channel order

## Multiple Channel

To support multiple channels, we need to configure channel layout first.

### Channel layout
Channel layout is a configuration specifying which channel will be used.

| label | Channel name         |
| ----- | -------------------- |
| FC    | Front Center         |
| FL    | Front Left           |
| FR    | Front Right          |
| LFE   | Low Frequency Effect |
| BL    | Back Left            |
| BR    | Back Right           |
| BC    | Back Center          |
| SL    | Side Left            |
| SR    | Side Right           |

The above are the most common channels, and the channel layout is the combination of them.
For example, audio 5.1(6 channels) may be the most famous type, which has a standard in [ITU-R BS.775][BS-775].
It contains _left_, _right_, _center_, _low frequency effect_, _left surround_
and _right surround_ channels.
However, it has a vague definition for _left/right surround_ channels.
It could be _back left/right_ or _side left/right_.

It may be a historical issue.
There is probably only one rear left and right speaker when 5.1 is proposed.
The channel layout now is up to 22.2(24 channels), which is specified in [ITU-R BS.2159][BS-2159], so we need to distinguish the different speakers in the rear.


_FFmpeg_ and _chromium_ are good references for the most frequently used layout:

 - [FFmpeg audio channel layouts](https://www.ffmpeg.org/doxygen/2.7/group__channel__mask__c.html) ([channel_layout.h](https://www.ffmpeg.org/doxygen/2.7/channel__layout_8h_source.html))
 - [channel layout in chromium](https://cs.chromium.org/chromium/src/media/base/channel_layout.h)

To be clear, we list some common combination here:
| Num. of ch. | Name       | Layout combination              |
| ----------- | ---------- | ------------------------------- |
|  1          | Mono       | FC                              |
|  2          | Stereo     | FL, FR                          |
|  3          | 2-1        | FL, FR, BC                      |
|  3          | 2.1        | FL, FR, LFE                     |
|  3          | 3.0        | FL, FR, FC                      |
|  4          | 3.1        | FL, FR, FC, LFE                 |
|  4          | 4.0        | FL, FR, FC, BC                  |
|  4          | Quad       | FL, FR, BL, BR                  |
|  5          | 4.1        | FL, FR, FC, LFE, BC             |
|  5          | 5.0(side)  | FL, FR, FC, SL, SR              |
|  5          | 5.0(back)  | FL, FR, FC, BL, BR              |
|  6          | 5.1(side)  | FL, FR, FC, LFE, SL, SR         |
|  6          | 5.1(back)  | FL, FR, FC, LFE, BL, BR         |

#### __.1__ channel
Because _LFE_ channel requires only a fraction of the bandwidth ot other audio channels, it refers to the __.1__ channel(e.g., 5.1 and 7.1).

### Channel Order
SMPTE and ITU define a standard order for channels.
The general channel assignment table from [ITU-R BS.2159][BS-2159] is:
| Ch. num. | label | Full name               |
| -------- | ----- | ----------------------- |
| 1        | FL    | Front Left              |
| 2        | FR    | Front Right             |
| 3        | FC    | Front Centre            |
| 4        | LFE1  | Low Frequency Effects-1 |
| 5        | BL    | Back Left               |
| 6        | BR    | Back Right              |
| 7        | FLc   | Front Left Centre       |
| 8        | FRc   | Front Right Centre      |
| 9        | BC    | Back Centre             |
| 10       | LFE2  | Low Frequency Effects-2 |
| 11       | Sil   | Side Left               |
| 12       | SiR   | Side Right              |
| ...      | ...   | ...                     |

However, they are various in the real world.
For example, _Microsoft_ defines [their own order](https://msdn.microsoft.com/en-us/library/windows/hardware/dn653308(v=vs.85).aspx#Default_Channel_Ordering).

To know more about channel order, take a look its definition in [chromium project](https://cs.chromium.org/chromium/src/media/base/channel_layout.cc).

### Channel Manipulation

- Downmix: input channel number > output channel number
- Upmix: input channel number < output channel number

The [channel manipulations in FFmpeg](https://trac.ffmpeg.org/wiki/AudioChannelManipulation):

- stereo → mono stream
- stereo → 2 × mono files
- stereo → 2 × mono streams
- mono → stereo
- 2 × mono → stereo
- 6 × mono → 5.1
- 5.1 → 6 × mono
- 5.1 → stereo
- 2 × stereo → stereo
- Mix both stereo channels to stereo
- Switch stereo channels
- Mute a channel



[cubeb_kinetik]: https://github.com/kinetiknz/cubeb "cubeb"
[cubeb_cmc]: https://github.com/ChunMinChang/cubeb "cubeb"
[cubeb.h]: https://github.com/kinetiknz/cubeb/blob/master/include/cubeb/cubeb.h "cubeb.h"
[libcubeb]: http://searchfox.org/mozilla-central/source/media/libcubeb "libcubeb"
[gecko]: https://github.com/mozilla/gecko-dev "Mozilla Gecko"
[cubebutils]: http://searchfox.org/mozilla-central/source/dom/media/CubebUtils.h "CubebUtils.h"
[cubeb-ctx-in-as]: http://searchfox.org/mozilla-central/rev/d96317a351af8aa78ab9847e7feed964bbaac7d7/dom/media/AudioStream.cpp#350 "cubeb context in AudioStream"

[BS-775]: https://www.itu.int/rec/R-REC-BS.775/en "ITU-R BS.775"
[BS-2159]: http://www.itu.int/pub/R-REP-BS.2159 "ITU-R BS.2159"
