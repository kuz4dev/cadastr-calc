import React, { useRef, useState } from 'react';
import styles from './DataFrame.module.css';
import { Button, Heading, Stack, useToast } from '@chakra-ui/react';
import { Polygon } from '@pbe/react-yandex-maps';
import nextId from 'react-id-generator';

function DataFrame({ polygons, setPolygons }) {

	const [file, setFile] = useState(false);
	const [isReading, setIsReading] = useState(false);

	const inputRef = useRef();
	const toast = useToast();

	const handleUploadClick = () => {
		inputRef.current?.click();
	};

	const handleFileChange = (e) => {
		const files = e.target.files;
		if (!files) {
			return false;
		}
		console.log(files);
		if (files.length > 1) {
			toast({
				title: 'Ошибка',
				description: 'Вы не можете загрузить больше одного файла',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return false;
		}

		const file = files[0];
		if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.geojson')) {
			toast({
				title: 'Ошибка',
				description: 'Вы можете загрузить только GeoJSON/JSON файл',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
			return false;
		}

		setFile(e.target.files[0]);
	};

	const readFile = () => {
		const reader = new FileReader();
		reader.readAsText(file);
		reader.addEventListener('load', (event) => readGeoJson(event));
		reader.addEventListener('error', (event) => {
			console.error('[ParseJSON]:', event);
			toast({
				title: 'Ошибка',
				description: 'Произошла ошибка в чтении файла',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		});
	};

	const readGeoJson = (event) => {
		setIsReading(true);
		const errorIndexes = [];
		try {
			const geodata = JSON.parse(event.target.result);
			if (geodata.features == null || !Array.isArray(geodata.features)) {
				return window.alert('Некорректный формат GEOJSON (features)');
			}

			geodata.features
				.filter((feature, index) => {
					if (feature == null || typeof feature !== 'object') {
						errorIndexes.push(index);
						return false;
					}
					if (feature.id == null) {
						feature.id = index + 1;
					}
					if (typeof feature.id !== 'number' || typeof feature.type !== 'string') {
						errorIndexes.push(index);
						return false;
					}

					if (!['Point', 'LineString', 'Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
						errorIndexes.push(index);
						return false;
					}

					if (feature.geometry == null || typeof feature.geometry !== 'object') {
						errorIndexes.push(index);
						return false;
					}

					if (!Array.isArray(feature.geometry.coordinates)) {
						errorIndexes.push(index);
						return false;
					}

					return true;
				})
				.forEach((feature) => {
					switch (feature.geometry.type) {
						case 'Polygon': {
							const ref = React.createRef();
							const uid = nextId();
							setPolygons((prev) =>
								prev.concat([
									{
										ref: ref,
										object: (
											<Polygon
												key={uid}
												instanceRef={ref}
												geometry={feature.geometry.coordinates.map((item) =>
													item.map((coords) => [coords[1], coords[0]]),
												)}
												properties={{
													uid: uid,
												}}
												options={{
													editorDrawingCursor: 'crosshair',
													fillColor: '#c6f6d5',
													strokeColor: '#3081ce',
													strokeWidth: 5,
													fillOpacity: 1,
												}}
											/>
										),
									},
								]),
							);
							setTimeout(() => {
								ref.current?.editor.startEditing();
								ref.current?.editor.events.add('vertexadd', (event) => {});
							}, 200);
							break;
						}
						case 'MultiPolygon': {
							feature.geometry.coordinates.forEach((polygon) => {
								const ref = React.createRef();
								const uid = nextId();
								setPolygons((prev) =>
									prev.concat([
										{
											ref: ref,
											object: (
												<Polygon
													key={uid}
													instanceRef={ref}
													geometry={polygon.map((item) =>
														item.map((coords) => [coords[1], coords[0]]),
													)}
													properties={{
														uid: uid,
													}}
													options={{
														editorDrawingCursor: 'crosshair',
														fillColor: '#c6f6d5',
														strokeColor: '#3081ce',
														strokeWidth: 5,
														fillOpacity: 1,
													}}
												/>
											),
										},
									]),
								);
								setTimeout(() => {
									ref.current?.editor.startEditing();
									ref.current?.editor.events.add('vertexadd', (event) => {});
								}, 200);
							});
							break;
						}
						default:
							break;
					}
				});

			setIsReading(false);
		} catch (error) {
			console.log(errorIndexes);
			console.error('[ReadGeoJson]:', error);
			window.alert('Ошибка при обработке GEOJSON');
		}
	};

	function generateJSON() {
		const result = {
			type: 'FeatureCollection',
			features: [],
		};
		if (polygons.length > 0) {
			polygons.forEach((item, i) => {
				const type = 'MultiPolygon';
				let coordinates;

				coordinates = item.ref.current.geometry
					.getCoordinates()
					.map((item) => item.map((coords) => copy(coords).reverse()));

				result.features.push({
					id: i,
					type: type,
					geometry: {
						type: type,
						coordinates: [coordinates],
					},
				});
			});
		}
		return result;
	}

	function copy(element) {
		const json = JSON.stringify(element);
		return JSON.parse(json);
	}

	function downloadJSON() {
		if (polygons.length > 0) {
			const json = generateJSON();
			const bytes = new TextEncoder().encode(JSON.stringify(json));
			const blob = new Blob([bytes], { type: 'application/json;charset=utf-8' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'geojson.json';
			a.click();
			window.URL.revokeObjectURL(url);
		} else {
			toast({
				title: 'Ошибка',
				description: 'Нет объектов выбранных типов',
				status: 'error',
				duration: 3000,
				isClosable: true,
			});
		}
	}

	return (
		<div className={styles.frame}>
			<Heading
				as="h5"
				size="sm">
				Здесь Вы можете экспортировать выбранные типы объектов (GeoJSON)
			</Heading>
			<Stack direction={'row'}>
				<Button
					onClick={downloadJSON}
					marginTop={'auto'}
					w={'200px'}
					colorScheme={'blue'}>
					Экспортировать
				</Button>
			</Stack>

			<Heading
				as="h5"
				size="sm">
				Здесь Вы можете импортировать объекты (GeoJSON)
			</Heading>
			<Stack direction={'row'}>
				{' '}
				<Button
					minWidth={'250px'}
					maxWidth={'300px'}
					onClick={handleUploadClick}>
					{file ? `${file.name}` : 'Нажмите для выбора файла'}
				</Button>
				<Button
					isLoading={isReading}
					loadingText={'Чтение'}
					isDisabled={!file}
					colorScheme="blue"
					w={'200px'}
					onClick={readFile}>
					Импортировать
				</Button>
				{file && (
					<Button
						isDisabled={isReading}
						colorScheme="blue"
						w={'200px'}
						onClick={() => setFile(false)}>
						Сбросить
					</Button>
				)}
			</Stack>

			<input
				type="file"
				ref={inputRef}
				onChange={handleFileChange}
				style={{ display: 'none' }}
			/>
		</div>
	);
}

export default DataFrame;
