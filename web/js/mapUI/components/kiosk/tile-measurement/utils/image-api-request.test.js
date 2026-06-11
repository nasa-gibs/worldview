import axios from 'axios';
import { saveAs } from 'file-saver';
import fetchWMSImage from './image-api-request';

jest.mock('axios');
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

const mockObjectUrl = 'blob:mock-object-url';
const mockLayer = 'MODIS_Terra_CorrectedReflectance_TrueColor';
const mockDate = '2024-06-15';
const mockExtent = [-100, 30, -80, 50];
const mockResponseData = new ArrayBuffer(8);
const mockContentType = 'image/jpeg';

function buildAxiosResponse(overrides = {}) {
  return {
    data: mockResponseData,
    headers: { 'content-type': mockContentType },
    ...overrides,
  };
}

describe('fetchWMSImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.URL.createObjectURL = jest.fn(() => mockObjectUrl);
    global.URL.revokeObjectURL = jest.fn();
    axios.get.mockResolvedValue(buildAxiosResponse());
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ── Return value ───────────────────────────────────────────────────────────

  describe('return value', () => {
    it('returns a blob object URL on success', async () => {
      const result = await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(result).toBe(mockObjectUrl);
    });

    it('returns null when axios throws', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      const result = await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(result).toBeNull();
    });
  });

  // ── axios.get call ────────────────────────────────────────────────────────

  describe('axios.get call', () => {
    it('calls axios.get with the correct base URL', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(axios.get).toHaveBeenCalledWith(
        'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
        expect.anything(),
      );
    });

    it('calls axios.get with responseType "arraybuffer"', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ responseType: 'arraybuffer' }),
      );
    });

    it('calls axios.get exactly once', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  // ── WMS params ─────────────────────────────────────────────────────────────

  describe('WMS params', () => {
    async function getParams() {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      return axios.get.mock.calls[0][1].params;
    }

    it('sets version to "1.3.0"', async () => {
      expect((await getParams()).version).toBe('1.3.0');
    });

    it('sets service to "WMS"', async () => {
      expect((await getParams()).service).toBe('WMS');
    });

    it('sets request to "GetMap"', async () => {
      expect((await getParams()).request).toBe('GetMap');
    });

    it('sets format to "image/jpeg"', async () => {
      expect((await getParams()).format).toBe('image/jpeg');
    });

    it('sets STYLE to "default"', async () => {
      expect((await getParams()).STYLE).toBe('default');
    });

    it('sets CRS to "EPSG:3857"', async () => {
      expect((await getParams()).CRS).toBe('EPSG:3857');
    });

    it('sets HEIGHT to "256"', async () => {
      expect((await getParams()).HEIGHT).toBe('256');
    });

    it('sets WIDTH to "256"', async () => {
      expect((await getParams()).WIDTH).toBe('256');
    });

    it('sets TIME to the provided date', async () => {
      expect((await getParams()).TIME).toBe(mockDate);
    });

    it('sets layers to the provided layer', async () => {
      expect((await getParams()).layers).toBe(mockLayer);
    });

    it('sets bbox from the extent when extent has no NaN', async () => {
      expect((await getParams()).bbox).toBe('-100,30,-80,50');
    });

    it('sets bbox to the full extent when extent contains NaN', async () => {
      await fetchWMSImage(mockLayer, mockDate, [NaN, 30, -80, 50], false);
      const params = axios.get.mock.calls[0][1].params;
      expect(params.bbox).toBe('-20037508.34,-20048966.1,20037508.34,20048966.1');
    });

    it('uses full extent bbox when any extent value is NaN', async () => {
      await fetchWMSImage(mockLayer, mockDate, [-100, NaN, NaN, NaN], false);
      const params = axios.get.mock.calls[0][1].params;
      expect(params.bbox).toBe('-20037508.34,-20048966.1,20037508.34,20048966.1');
    });

    it('builds bbox string as "x1,y1,x2,y2"', async () => {
      await fetchWMSImage(mockLayer, mockDate, [1, 2, 3, 4], false);
      const params = axios.get.mock.calls[0][1].params;
      expect(params.bbox).toBe('1,2,3,4');
    });
  });

  // ── Blob / URL.createObjectURL ─────────────────────────────────────────────

  describe('Blob and URL.createObjectURL', () => {
    it('calls URL.createObjectURL with a Blob', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      const arg = URL.createObjectURL.mock.calls[0][0];
      expect(arg).toBeInstanceOf(Blob);
    });

    it('creates the Blob with the content-type from response headers', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      const blob = URL.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe(mockContentType);
    });

    it('returns the result of URL.createObjectURL', async () => {
      global.URL.createObjectURL.mockReturnValue('blob:custom-url');
      const result = await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(result).toBe('blob:custom-url');
    });
  });

  // ── testMode ───────────────────────────────────────────────────────────────

  describe('testMode', () => {
    it('does NOT call saveAs when testMode is false', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(saveAs).not.toHaveBeenCalled();
    });

    it('calls saveAs when testMode is true', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, true);
      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('calls saveAs with a Blob and the correct filename when testMode is true', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, true);
      const [blob, filename] = saveAs.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(filename).toBe(`${mockLayer}.jpeg`);
    });

    it('calls saveAs with a Blob of type "image/jpeg" when testMode is true', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, true);
      const blob = saveAs.mock.calls[0][0];
      expect(blob.type).toBe('image/jpeg');
    });

    it('does NOT call saveAs when testMode is undefined', async () => {
      await fetchWMSImage(mockLayer, mockDate, mockExtent, undefined);
      expect(saveAs).not.toHaveBeenCalled();
    });
  });

  // ── error handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('calls console.error when axios throws', async () => {
      const mockError = new Error('Network error');
      axios.get.mockRejectedValue(mockError);
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(console.error).toHaveBeenCalledWith(mockError);
    });

    it('returns null when axios throws', async () => {
      axios.get.mockRejectedValue(new Error('fail'));
      const result = await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(result).toBeNull();
    });

    it('does NOT call saveAs when axios throws', async () => {
      axios.get.mockRejectedValue(new Error('fail'));
      await fetchWMSImage(mockLayer, mockDate, mockExtent, true);
      expect(saveAs).not.toHaveBeenCalled();
    });

    it('does NOT call URL.createObjectURL when axios throws', async () => {
      axios.get.mockRejectedValue(new Error('fail'));
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('calls console.error exactly once when axios throws', async () => {
      axios.get.mockRejectedValue(new Error('fail'));
      await fetchWMSImage(mockLayer, mockDate, mockExtent, false);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});
