export default function getConfig(colors) {
  return {
    defaults: {
      projection: 'geographic',
      startingLayers: [
        { id: 'terra-aod' },
        { id: 'terra-cr' },
        { id: 'aqua-cr', hidden: 'true' },
      ],
    },
    projections: {
      geographic: {
        id: 'geographic',
        epsg: 4326,
        crs: 'EPSG:4326',
        maxExtent: [-180, -90, 180, 90],
      },
      arctic: {
        id: 'arctic',
        epsg: 3413,
        crs: 'EPSG:3413',
      },
      antarctic: {
        id: 'antarctic',
        epsg: 3031,
        crs: 'EPSG:3031',
      },
    },
    layers: {
      'terra-cr': {
        id: 'terra-cr',
        group: 'baselayers',
        dateRanges: [
          {
            dateInterval: '1',
            endDate: '2020-05-20T00:00:00Z',
            startDate: '2000-02-24T00:00:00Z',
          },
        ],
        period: 'daily',
        startDate: '2000-02-24T00:00:00Z',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      'terra-cr-2': {
        id: 'terra-cr',
        group: 'baselayers',
        dateRanges: [
          {
            dateInterval: '1',
            endDate: '2020-05-20T00:00:00Z',
            startDate: '2000-02-24T00:00:00Z',
          },
          {
            dateInterval: '1',
            endDate: '2020-06-20T00:00:00Z',
            startDate: '2020-06-20T00:00:00Z',
          },
        ],
        period: 'daily',
        startDate: '2000-02-24T00:00:00Z',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      'aqua-cr': {
        id: 'aqua-cr',
        group: 'baselayers',
        period: 'daily',
        startDate: '2002-01-01',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      mask: {
        id: 'mask',
        group: 'baselayers',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      AMSRE_Brightness_Temp_89H_Night: {
        id: 'AMSRE_Brightness_Temp_89H_Night',
        title: 'Brightness Temperature (89H GHz B Scan, Night)',
        subtitle: 'Aqua / AMSR-E',
        description: 'amsre/AMSRE_Brightness_Temp_89H_Night',
        group: 'overlays',
        product: 'AE_L2A_NIGHT',
        layergroup: ['amsre'],
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
        inactive: true,
      },
      MODIS_Combined_L4_LAI_4Day: {
        id: 'MODIS_Combined_L4_LAI_4Day',
        title: 'Leaf Area Index (L4, 4-Day)',
        subtitle: 'Terra and Aqua / MODIS',
        description: 'modis/combined/MODIS_Combined_L4_LAI_4Day',
        group: 'overlays',
        product: 'MCD15A3H',
        layergroup: 'Leaf Area Index',
        period: 'daily',
        dateRanges: [
          {
            startDate: '2018-01-01T00:00:00Z',
            endDate: '2018-12-27T00:00:00Z',
            dateInterval: '4',
          },
          {
            startDate: '2019-01-01T00:00:00Z',
            endDate: '2019-12-27T00:00:00Z',
            dateInterval: '4',
          },
          {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2020-09-25T00:00:00Z',
            dateInterval: '4',
          },
        ],
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      'terra-aod': {
        id: 'terra-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2000-01-01',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
        palette: {
          id: 'terra-aod',
        },
      },
      'aqua-aod': {
        id: 'aqua-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2002-01-01',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
        palette: {
          id: 'aqua-aod',
        },
      },
      'combo-aod': {
        id: 'combo-aod',
        group: 'overlays',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
      },
      OrbitTracks_Aqua_Ascending: {
        id: 'OrbitTracks_Aqua_Ascending',
        title: 'Orbit Tracks (Ascending, Points, Aqua)',
        subtitle: '',
        description: 'vector/OrbitTracks_Aqua_Ascending',
        type: 'vector',
        tags: 'vector vectors',
        group: 'overlays',
        layergroup: 'Orbital Track',
        inactive: true,
        vectorStyle: {
          id: 'OrbitTracks_Aqua_Ascending',
        },
        period: 'daily',
      },
      'GOES-East_ABI_GeoColor': {
        id: 'GOES-East_ABI_GeoColor',
        type: 'wmts',
        format: 'image/png',
        period: 'subdaily',
        startDate: '2021-04-29T18:00:00Z',
        dateRanges: [
          {
            startDate: '2021-04-29T18:00:00Z',
            endDate: '2021-04-29T18:20:00Z',
            dateInterval: '10',
          },
          {
            startDate: '2021-04-29T18:40:00Z',
            endDate: '2021-04-29T18:50:00Z',
            dateInterval: '10',
          },
          {
            startDate: '2021-06-23T17:30:00Z',
            endDate: '2021-06-30T00:00:00Z',
            dateInterval: '10',
          },
          { // same start/end (single datetime)
            startDate: '2022-01-24T17:00:00Z',
            endDate: '2022-01-24T17:00:00Z',
            dateInterval: '10',
          },
          { // gap between this and previous
            startDate: '2022-01-24T20:50:00Z',
            endDate: '2022-01-25T00:00:00Z',
            dateInterval: '10',
          },
          { // shares overlapping date with previous
            startDate: '2022-01-25T00:00:00Z',
            endDate: '2022-01-25T04:10:00Z',
            dateInterval: '10',
          },
          {
            startDate: '2022-01-25T04:30:00Z',
            endDate: '2022-01-25T13:00:00Z',
            dateInterval: '10',
          },
        ],
        projections: {
          geographic: {
            source: 'GIBS:geographic',
            matrixSet: '1km',
            matrixSetLimits: [
              {
                tileMatrix: '0',
                minTileRow: 0,
                maxTileRow: 0,
                minTileCol: 0,
                maxTileCol: 0,
              },
              {
                tileMatrix: '1',
                minTileRow: 0,
                maxTileRow: 1,
                minTileCol: 0,
                maxTileCol: 1,
              },
              {
                tileMatrix: '2',
                minTileRow: 0,
                maxTileRow: 2,
                minTileCol: 0,
                maxTileCol: 2,
              },
              {
                tileMatrix: '3',
                minTileRow: 0,
                maxTileRow: 4,
                minTileCol: 0,
                maxTileCol: 5,
              },
              {
                tileMatrix: '4',
                minTileRow: 0,
                maxTileRow: 9,
                minTileCol: 1,
                maxTileCol: 10,
              },
              {
                tileMatrix: '5',
                minTileRow: 0,
                maxTileRow: 18,
                minTileCol: 2,
                maxTileCol: 20,
              },
              {
                tileMatrix: '6',
                minTileRow: 2,
                maxTileRow: 38,
                minTileCol: 5,
                maxTileCol: 41,
              },
            ],
          },
        },
        title: 'GeoColor (True Color (Day), Multispectral IR (Night))',
        subtitle: 'GOES-East/ABI',
        group: 'overlays',
        layergroup: 'Geostationary',
        product: '',
        wrapX: true,
        daynight: [
          'day',
          'night',
        ],
        availability: {
          rollingWindow: 90,
          historicalRanges: [
            {
              startDate: '2021-08-30T08:40:00Z',
              endDate: '2021-08-30T08:40:00Z',
              dateInterval: '10',
            },
          ],
        },
      },
    },
    naturalEvents: {
      categories: [
        {
          id: 'dustHaze',
          title: 'Dust and Haze',
          description: 'Related to dust storms, air pollution and other non-volcanic aerosols. Volcano-related plumes shall be included with the originating eruption event.',
          layers: 'https://eonet.gsfc.nasa.gov/api/v3/layers/dustHaze',
        },
        {
          id: 'manmade',
          title: 'Manmade',
          description: 'Events that have been human-induced and are extreme in their extent.',
          layers: 'https://eonet.gsfc.nasa.gov/api/v3/layers/manmade',
        },
        {
          id: 'seaLakeIce',
          title: 'Sea and Lake Ice',
          description: 'Related to all ice that resides on oceans and lakes, including sea and lake ice (permanent and seasonal) and icebergs.',
          layers: 'https://eonet.gsfc.nasa.gov/api/v3/layers/seaLakeIce',
        }],
    },
    features: {
      compare: true,
      naturalEvents: {
        host: 'fake.eonet.url/api',
      },
    },
    palettes: {
      lookups: {
        'terra-aod': {
          'min-1': {
            '0,255,0,255': {
              r: 0, g: 0, b: 0, a: 0,
            },
            '255,255,0,255': {
              r: 255, g: 255, b: 0, a: 255,
            },
            '255,0,0,255': {
              r: 255, g: 0, b: 0, a: 255,
            },
          },
          'red-1': {
            '0,255,0,255': {
              a: 255,
              b: 240,
              g: 240,
              r: 255,
            },
            '255,0,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 64,
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255,
            },
          },
          'max-1-squashed': {
            '0,255,0,255': {
              a: 255,
              b: 0,
              g: 255,
              r: 0,
            },
            '255,0,0,255': {
              a: 0,
              b: 0,
              g: 0,
              r: 0,
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255,
            },
          },
        },
      },
      rendered: {
        'terra-aod': {
          id: 'terra-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [colors.green, colors.yellow, colors.red],
                values: [0, 1, 2],
                refs: ['0', '1', '2'],

              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
        'aqua-aod': {
          id: 'aqua-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [colors.green, colors.yellow, colors.red],
                values: [0, 1, 2],
                refs: ['0', '1', '2'],

              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
      },
      custom: {
        'blue-1': {
          colors: [colors.light_blue, colors.blue, colors.dark_blue],
        },
        'red-1': {
          colors: [colors.light_red, colors.red, colors.dark_red],
        },
      },
    },
    vectorData: {
      OrbitTracks: {
        id: 'Orbit_Tracks',
        mvt_properties: [
          {
            Function: 'Style',
            Description: 'Up/Down/Both',
            IsOptional: 'False',
            Title: 'Direction of travel',
            DataType: 'string',
            ValueList: ['Ascending', 'Descending', 'Transitional'],
            Identifier: 'direction',
          },
          {
            Function: 'Describe',
            Description: 'The datetime, in UTC.',
            IsOptional: 'False',
            Title: 'Datetime',
            DataType: 'datetime',
            Identifier: 'datetime',
          },
          {
            Function: 'Describe',
            Description: 'Was it day or night?',
            IsOptional: 'False',
            Title: 'Day/Night Flag',
            DataType: 'string',
            ValueList: ['Day', 'Night', 'Both'],
            Identifier: 'day_night',
          },
          {
            Function: 'Describe',
            Description: 'Just an ID',
            IsOptional: 'False',
            Title: 'Identifier',
            DataType: 'int',
            Identifier: 'id',
          },
          {
            Function: 'Identify',
            Description: 'Default time (hh:mm:ss).',
            IsOptional: 'False',
            Title: 'Label for default display',
            DataType: 'string',
            Identifier: 'label',
          },
        ],
      },
    },
    vectorStyles: {
      OrbitTracks_Aura_Ascending: {
        version: 8,
        name: 'Orbit Tracks',
        sources: {
          OrbitTracks_Aqua_Ascending: {
            type: 'vector',
            tiles: [
              'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
            ],
          },
          yellow1: {
            type: 'vector',
            tiles: [
              'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
            ],
          },
        },
        layers: [
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'line',
            paint: {
              'line-color': 'rgb(21, 192, 230)',
              'line-width': 2,
            },
          },
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'circle',
            paint: {
              'circle-radius': '5',
              'circle-color': 'rgb(21, 192, 230)',
            },
          },
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 10,
              'text-transform': 'uppercase',
              'text-letter-spacing': 0.05,
              'text-offset': [-2.5, 0],
            },
            paint: {
              'text-color': '#fff',
              'text-halo-color': '#999',
              'text-halo-width': 1,
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'line',
            paint: {
              'line-color': 'rgb(204, 255, 51)',
              'line-width': 2,
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'circle',
            paint: {
              'circle-radius': '5',
              'circle-color': 'rgb(204, 255, 51)',
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 10,
              'text-transform': 'uppercase',
              'text-letter-spacing': 0.05,
              'text-offset': [-2.5, 0],
            },
            paint: {
              'text-color': '#fff',
              'text-halo-color': '#999',
              'text-halo-width': 1,
            },
          },
        ],
      },
    },
  };
}
