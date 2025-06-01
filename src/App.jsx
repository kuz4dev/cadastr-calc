import React from 'react'
import styles from './App.module.css'
import {
	YMaps,
	Map,
	Polygon,
} from '@pbe/react-yandex-maps'
import {
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
} from '@chakra-ui/react'

import nextId from 'react-id-generator'
import TablePolygons from './widgets/TablePolygons/TablePolygons'

function App() {
	const mapRef = React.useRef()

	const [type, _] = React.useState('Polygon')
	const [polygons, setPolygons] = React.useState([])
	const [printMode, setPrintMode] = React.useState(false)
	const [mapState, setMapState] = React.useState({
		center: [55.751574, 37.573856],
		zoom: 11,
		controls: ['fullscreenControl'],
	});

	const createObject = e => {
		setPrintMode(true);
		const uid = nextId()
		const ref = React.createRef()

		// Создаём новый полигон
		const newPolygon = {
			ref: ref,
			object: (
				<Polygon
					key={uid}
					instanceRef={ref}
					geometry={[]}
					properties={{
						uid: uid,
					}}
					options={{
						editorDrawingCursor: 'crosshair',
						fillColor: '#c6f6d5',
						strokeColor: '#00BFFF',
						strokeWidth: 2,
						fillOpacity: 0.5,
					}}
				/>
			),
		};

		// Обновляем состояние и в коллбэке работаем с обновлённым массивом
		setPolygons(prev => {
			const updatedPolygons = prev.concat([newPolygon]);

			// Запускаем отрисовку после обновления состояния
			setTimeout(() => {
				const polygonRef = updatedPolygons[updatedPolygons.length - 1].ref;
				polygonRef.current?.editor.startDrawing();
				polygonRef.current?.editor.events.add('vertexadd', event => {});
			}, 0);

			return updatedPolygons;
		});
	}

	return (
		<div className={styles.app}>
			<Tabs colorScheme='blue'>
				<TabList
					width={'40vw'}
					display={'flex'}
					justifyContent={'space-around'}
				>
					<Tab width={'200px'}>Участки</Tab>
				</TabList>
				<TabPanels height={'95vh'} overflowY={'auto'}>

					<TabPanel paddingLeft={0} paddingRight={0}>
						<TablePolygons
							setMapState={setMapState}
							polygons={polygons}
							printMode={printMode}
							type={type}
							setPolygons={setPolygons}
							styles={styles}
						/>
					</TabPanel>
				</TabPanels>
			</Tabs>
			<YMaps
				enterprise
				query={{
					apikey: 'ec5316ab-5c7b-4485-87d4-c84899a47cd5',
				}}
			>
				<Map
					state={mapState}
					instanceRef={mapRef}
					width={'60vw'}
					height={'100vh'}
					modules={[
						'control.ZoomControl',
						'control.FullscreenControl',
						'geoObject.addon.editor',
					]}
					onClick={e => {
						createObject(e)
					}}
					onContextMenu={() => {
						setPrintMode(false);
						polygons[polygons.length - 1]?.ref?.current?.editor.stopDrawing();
					}}
				>
					{polygons.map(el => {
						return el.object
					})}
				</Map>
			</YMaps>
		</div>
	)
}

export default App
