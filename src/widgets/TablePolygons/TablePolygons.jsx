import React from 'react';
import * as turf from "@turf/turf";
import {
	Button,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
} from '@chakra-ui/react';
import { Polygon } from '@pbe/react-yandex-maps';
import styles from './../../App.module.css';



function TablePolygons({ polygons, printMode, type, setPolygons, setMapState }) {
	function randomUKS(min = 50, max = 700) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	return (
		<Table
			variant="striped"
			colorScheme="blue">
			<Thead>
				<Tr>
					<Th>Номер участка</Th>
					<Th isNumeric={true}>Площадь, м<sup>2</sup></Th>
					<Th isNumeric={true}>Удельная кадастровая стоимость, руб/м<sup>2</sup></Th>
					<Th isNumeric={true}>Кадастровая стоимость, руб</Th>
					<Th isNumeric={true}>Удаление</Th>
				</Tr>
			</Thead>
			<Tbody>
				{polygons.map((el, index) => {
					const area = el.ref.current ? Math.round(turf.area(turf.polygon(el.ref?.current.geometry.getCoordinates()))) : 'Ждем создание элемента';
					const uks = el.ref.current ? randomUKS() : 'Ждем создание элемента';
					return (
						<Tr
							onClick={() => {
								setMapState(prev => ({
									...prev,
									center: turf.centroid(turf.polygon(el.ref?.current.geometry.getCoordinates())).geometry.coordinates,
									zoom: undefined,
								}))
							}}
							className={styles.index}
							key={index}
						>
							<Td>{index + 1}</Td>
							<Td>{area}</Td>
							<Td>{uks}</Td>
							<Td>{el.ref.current ? uks * area : 'Ждем создание элемента'}</Td>
							<Td isNumeric={true}>
								<Button
									isDisabled={index === polygons.length - 1 && printMode && type === 'Polygon'}
									width={'150px'}
									colorScheme="blue"
									variant="solid"
									onClick={() => {
										setPolygons((prev) =>
											prev
												.filter((item) => item.object.key !== el.object.key)
												.map((polygon) => {
													return {
														ref: polygon.ref,
														object: (
															<Polygon
																instanceRef={polygon.ref}
																key={polygon.object.key}
																options={polygon.object.props.options}
																properties={polygon.object.props.properties}
																geometry={polygon.object.props.geometry}
															/>
														),
													};
												}),
										);
									}}>
									Удалить
								</Button>
							</Td>
						</Tr>
					);
				})}
			</Tbody>
		</Table>
	);
}

export default TablePolygons;
