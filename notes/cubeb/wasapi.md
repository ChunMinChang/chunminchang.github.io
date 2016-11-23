
# Cubeb notes for WAS API
To contribute to [cubeb](https://github.com/kinetiknz/cubeb), it needs to understand what is [COM](https://msdn.microsoft.com/en-us/library/windows/desktop/ms680573.aspx) first before programming on Windows. Then you should know what [Windows Audio Session API (WASAPI)](https://msdn.microsoft.com/en-us/library/windows/desktop/dd371455(v=vs.85).aspx) is.

[Here is my repo](https://github.com/ChunMinChang/cubeb/tree/audio5.1) for _audio 5.1_ version of cubeb.

## Study DOM
- [COM Technical Overview](https://msdn.microsoft.com/en-us/library/windows/desktop/ff637359(v=vs.85).aspx)(This might be similar to mozilla's XPCOM)
- [Understanding The COM Single-Threaded Apartment Part 1](http://www.codeproject.com/Articles/9190/Understanding-The-COM-Single-Threaded-Apartment-Pa)
- [Understanding The COM Single-Threaded Apartment Part 2](http://www.codeproject.com/Articles/9506/Understanding-The-COM-Single-Threaded-Apartment)
- [Processes, Threads, and Apartments](https://msdn.microsoft.com/en-us/library/windows/desktop/ms693344.aspx)

## How sound played in WAS API

### Windows audio session (WASAPI) sample

- [WindowsAudioSession Sample](https://github.com/Microsoft/Windows-universal-samples/tree/master/Samples/WindowsAudioSession)
- [Renderer(output)](https://github.com/Microsoft/Windows-universal-samples/blob/master/Samples/WindowsAudioSession/cpp/WASAPIRenderer.cpp)
- [Capture(input)](https://github.com/Microsoft/Windows-universal-samples/blob/master/Samples/WindowsAudioSession/cpp/WASAPICapture.cpp)
- [Rendering a Stream](https://msdn.microsoft.com/en-us/library/windows/desktop/dd316756(v=vs.85).aspx)

### The persudo code flow in cubeb:
```
HRESULT hr;
IMMDeviceEnumerator* enumerator;
IMMDevice* device;
IAudioClient* client;
WAVEFORMATEX* format;
typedef bool (*wasapi_render_callback)(wasapi_stream * stm);

struct wasapi_stream
{
  ...
  HANDLE thread; /* each stream has its own thread */
  HANDLE render_event;
  wasapi_render_callback render_callback;
  ...
};

wasapi_stream* stm = (wasapi_stream *)calloc(1, sizeof(wasapi_stream));

HANDLE stm->render_event = CreateEvent(NULL, 0, 0, NULL);
if (!stm->render_event) {
  return;
}

/* Get the device enumerator */
hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&enumerator));
if (FAILED(hr)) {
  return;
}

/* Use the device enumerator to get the default output device by eRender (eCapture is for input device) */
hr = enumerator->GetDefaultAudioEndpoint(eRender, eConsole, &device);
if (FAILED(hr)) {
  return;
}
enumerator->Release();

/* Get a output client. */
hr = device->Activate(__uuidof(IAudioClient), CLSCTX_INPROC_SERVER, NULL, (void **)client);
if (FAILED(hr)) {
  return;
}
device->Release();


/* Get the default format setting of the speakers */
hr = client->GetMixFormat(&format);
if (FAILED(hr)) {
  return;
}

...

/* Initialize the audio stream and enable event-driven buffering with the AUDCLNT_STREAMFLAGS_EVENTCALLBACK flag set */
hr = client->Initialize(AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_EVENTCALLBACK | AUDCLNT_STREAMFLAGS_NOPERSIST, ... ,format, NULL);
if (FAILED(hr)) {
  return;
}

CoTaskMemFree(format);

/* After enabling event-driven buffering, register the event handle that the system will signal each time a buffer becomes ready to be processed by the client. */
hr = client->SetEventHandle(stm->render_event);
if (FAILED(hr)) {
  return;
}

/* Start the audio stream */
hr = client->Start();
if (FAILED(hr)) {
  return;
}

stm->thread = (HANDLE) _beginthreadex(NULL, 512 * 1024, stream_render_loop, stm, STACK_SIZE_PARAM_IS_A_RESERVATION, NULL);
if (!stm->thread) {
  return;
}
...


static unsigned int __stdcall
stream_render_loop(LPVOID stream)
{
  wasapi_stream * stm = static_cast<wasapi_stream *>(stream);

  bool is_playing = true;
  const unsigned int len = 1;
  HANDLE wait_array[1] = {
    stm->render_event,
  };

  ...

  while (is_playing) {
    DWORD waitResult = WaitForMultipleObjects(len, wait_array, FALSE, 1000);
    switch (waitResult) {
      case WAIT_OBJECT_0: /* render_event */
        /* Check whether the stream is draining */
        is_playing = stm->render_callback(stm);
        break;
      case WAIT_TIMEOUT:
      case WAIT_FAILED:
      default:
        /* Error handling here */
	    break;
    }
  }
  ...
}

...
```

### Event callback mechanism

- It needs to set ```AUDCLNT_STREAMFLAGS_EVENTCALLBACK``` in [IAudioClient::Initialize](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370875(v=vs.85).aspx).
- Set your ```HANDLE event``` by [IAudioClient::SetEventHandle](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370878(v=vs.85).aspx).
- Start the stream by [IAudioClient::Start](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370879(v=vs.85).aspx).
- While the stream is running, the system __periodically signals the event__ to indicate to the client that audio data is available for processing.
- Between processing passes, the __client thread waits on the event handle__ by calling a synchronization function such as [WaitForSingleObject](https://msdn.microsoft.com/en-us/library/windows/desktop/ms687032(v=vs.85).aspx) or [WaitForMultipleObjects](https://msdn.microsoft.com/en-us/library/windows/desktop/ms687025(v=vs.85).aspx).
- In the above sample, the client thread is created by [_beginthreadex](https://msdn.microsoft.com/en-us/library/kdzttdcb.aspx).

## Multiple channels
To support multiple channels, we need to apply one [KSAUDIO_CHANNEL_CONFIG][KSAUDIO-CH-CONF] value to ```dwChannelMask```.

### Get default speaker settings via ```IAudioClient::GetMixFormat```

In WAS API, we could set channel layouts by ```dwChannelMask```, ```nChannels```,  and other properties in [WAVEFORMATEX](https://msdn.microsoft.com/en-us/library/windows/desktop/dd757713(v=vs.85).aspx) or [WAVEFORMATEXTENSIBLE structure](https://msdn.microsoft.com/en-us/library/windows/desktop/dd757714(v=vs.85).aspx). However, how do we get the default settings of our speakers? The answer is to use [IAudioClient::GetMixFormat](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370872(v=vs.85).aspx). We can use it to get default values before applying our desired layout.

### What is ```dwChannelMask```?

It's _bitmask_ specifying the assignment of channels in the stream to speaker positions.
The _number of bits_ set in ```dwChannelMask``` should be the __same__ as the _number of channels_ specified in ```WAVEFORMATEX.nChannels```.
If ```dwChannelMask = SPEAKER_FRONT_LEFT | SPEAKER_FRONT_RIGHT```(it has 2 1-bit in these bytes(default is 0)), then ```WAVEFORMATEX.nChannels = 2``` and data buffer ```float* buf``` will be interpreted as:

- ```buf[0]``` is the audio data for left channel
- ```buf[1]``` is the audio data for right channel
- ```buf[2]``` is the audio data for left channel
- ```buf[3]``` is the audio data for right channel
- ....
- ```buf[x + 2 * n]``` is the audio data for channel ```x```(left or right) , where ```n``` is an integer.

See [WAVEFORMATEXTENSIBLE structure](https://msdn.microsoft.com/zh-tw/library/windows/desktop/dd757714.aspx) for more detail.

### What's the relationship among channel buffers, volumes, and ```dwChannelMask```?

- The channel buffers and volumes are all __array__.
- ```buffer[x + n * k]``` and ```volumes[x + n * k]``` represent __audio data__ and __volume__ for channel ```x```, where ```k``` is the channel counts and ```n``` is an integer.
- The ```x```(left, right, center, ...) and ```k```(channel counts) depend on the ```dwChannelMask``` and ```WAVEFORMATEX.nChannels```settings.
- The following table shows the relationship between channel buffer data and volumes.

| buf | vol | result   |
| --- | --- | -------- |
| 0.0 | 0.0 | no sound |
| 0.0 | 1.0 | noise    |
| 1.0 | 0.0 | no sound |
| 1.0 | 1.0 | sound    |

See [IAudioStreamVolume::SetAllVolumes](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370992.aspx) and [IAudioRenderClient::GetBuffer](https://msdn.microsoft.com/zh-tw/library/windows/desktop/dd368243.aspx) for more detail.

### Checking preferred format via ```IAudioClient::IsFormatSupported```
To apply our channel layout setting, we can need to check it is valid.
The [IAudioClient::IsFormatSupported](https://msdn.microsoft.com/en-us/library/windows/desktop/dd370876(v=vs.85).aspx) indicates whether the audio endpoint device supports a particular stream format. If it return fail, it will also give you a __closest__ channel layout to use.

It is __necessary__ to call it before playing audio.

## How to sound only one speaker

### Can we force multiple-channel-speaker to use 1 channel only?
Is it possible to set  ```format_pcm->dwChannelMask = SPEAKER_FRONT_CENTER;``` and ```WAVEFORMATEX.nChannels = 1```  to a audio 5.1 speaker(6 channels)?

No! you will get ```S_FALSE``` when you call ```IAudioClient::IsFormatSupported```.You will get a __closest__ match that has 6 channels.

### How to sound only one channel ?
If you have multiple channels, you should set volume to ```0.0``` to all channels except the one you want to sound.
If you are able to set number of channels of your speakers in their drivers, then there's possible to set ```nChannels``` to a smaller value.


## Appendix

### How sound played in chromium?

1. There is a [WASAPIAudioOutputStream](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.h?l=121) object to handle the audio render stream on Windows.
  - Inherit [AudioOutputStream](https://cs.chromium.org/chromium/src/media/audio/audio_io.h?l=53)(base class for audio render stream).
  - Inherit [base::DelegateSimpleThread::Delegate](https://cs.chromium.org/chromium/src/base/threading/simple_thread.h?l=136) to handle thread stuffs.
	  - ```DelegateSimpleThread``` inherit [SimpleThread](https://cs.chromium.org/chromium/src/base/threading/simple_thread.h?l=60)
     - ```SimpleThread``` inherit [PlatformThread::Delegate](https://cs.chromium.org/chromium/src/base/threading/platform_thread.h?l=118)
     - ```PlatformThread::Delegate``` has a member [virtual void ThreadMain()](https://cs.chromium.org/chromium/src/base/threading/platform_thread.h?l=120)
     - ```SimpleThread``` has a member ```virtual void Run() = 0```, which should be overridden by its subclasses.
  - ```WASAPIAudioOutputStream``` has a member ```std::unique_ptr<base::DelegateSimpleThread> render_thread_``` pointing to the render thread.
2. Use [WASAPIAudioOutputStream::WASAPIAudioOutputStream](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=58) to construct a stream object
	- Set preferred format such as ```nChannels``` and ```dwChannelMask```.
3. And then open a render stream by [WASAPIAudioOutputStream::Open](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=137)
	- Check the format is supported by ```IsFormatSupported```
	- Initialize audio client by [CoreAudioUtil::SharedModeInitialize](https://cs.chromium.org/chromium/src/media/audio/win/core_audio_util_win.cc?l=804) or [ExclusiveModeInitialization](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=567)
		- ```IAudioClient::Initialize``` and ```IAudioClient::SetEventHandle``` are called
4. Next, run the render stream by [WASAPIAudioOutputStream::Start](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=263)
	- ```render_thread_``` is setup
	- Start running thread by ```render_thread_->Start()```
		- ```DelegateSimpleThread->Start()``` is actually [SimpleThread::Start()](https://cs.chromium.org/chromium/src/base/threading/simple_thread.cc?l=31)
		- [PlatformThread::CreateWithPriority](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=188) or [PlatformThread::CreateNonJoinableWithPriority](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=196) is called
		- Both above two will call [CreateThread](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=81)
		- ```CreateThread``` will fire [pthread_create](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=110)
		- ```pthread_create``` will call [ThreadFunc](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=48)
     - ```ThreadFunc``` will trigger [delegate->ThreadMain()](https://cs.chromium.org/chromium/src/base/threading/platform_thread_posix.cc?l=71)
     - ```delegate->ThreadMain()``` is actually [SimpleThread::ThreadMain()](https://cs.chromium.org/chromium/src/base/threading/simple_thread.cc?l=58)
     - ```SimpleThread::ThreadMain()``` will fire [SimpleThread::Run](https://cs.chromium.org/chromium/src/base/threading/simple_thread.cc?l=68)
     - ```SimpleThread::Run``` is actually [DelegateSimpleThread::Run()](https://cs.chromium.org/chromium/src/base/threading/simple_thread.cc?l=85)
     - ```DelegateSimpleThread::Run``` will call [delegate->Run()](https://cs.chromium.org/chromium/src/base/threading/simple_thread.cc?l=92)
     - ```delegate->Run()``` is actually [WASAPIAudioOutputStream::Run()](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=371)
	- ```IAudioClient::Start``` is called
5. The render events come into [WASAPIAudioOutputStream::Run()](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.cc?l=371)
	- ```WaitForMultipleObjects``` is used to wait the [stop_render_event_](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.h?l=240) and [audio_samples_render_event_](https://cs.chromium.org/chromium/src/media/audio/win/audio_low_latency_output_win.h?l=237)

## Reference
- [KSAUDIO_CHANNEL_CONFIG][KSAUDIO-CH-CONF]
- [Multiple channel audio data and WAVE files](https://msdn.microsoft.com/en-us/library/windows/hardware/dn653308.aspx)
- [DirectSound Speaker Config: KSAUDIO_SPEAKER_XXX](http://www-mmsp.ece.mcgill.ca/documents/audioformats/wave/Docs/ksmedia.h)
- [Translating Speaker-Configuration Requests](https://msdn.microsoft.com/en-us/library/windows/hardware/ff538602.aspx)

[KSAUDIO-CH-CONF]: https://msdn.microsoft.com/en-us/library/windows/hardware/ff537083.aspx "KSAUDIO_CHANNEL_CONFIG"
