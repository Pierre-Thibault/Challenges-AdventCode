use std::cmp::{max, min};
use std::collections::{BTreeSet, HashMap, HashSet};
use std::fs::File;
use std::io::{BufRead, BufReader, Result};
use std::marker::PhantomData;

#[derive(Hash, Eq, PartialEq, Clone, Copy, Default)]
struct Point {
    x: i32,
    y: i32,
}

fn read_lines(filename: &str) -> Result<impl Iterator<Item = Result<String>>> {
    let file = File::open(filename)?;
    Ok(BufReader::new(file).lines())
}

fn parse_points(lines: impl Iterator<Item = Result<String>>) -> Vec<Point> {
    let mut points = Vec::new();
    for line in lines {
        let line = line.expect("Failed to read line");
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() == 2 {
            let x = parts[0].parse::<i32>().expect("Failed to parse x");
            let y = parts[1].parse::<i32>().expect("Failed to parse y");
            points.push(Point { x, y });
        } else {
            panic!("Cannot parse point")
        }
    }
    points
}

fn get_rectangle_area(a: Point, b: Point) -> i64 {
    ((a.x - b.x).abs() + 1) as i64 * ((a.y - b.y).abs() + 1) as i64
}

// ***********************************************************************************
// Part one
// ***********************************************************************************

fn find_biggest_rectangle_default(points: &[Point]) -> i64 {
    find_biggest_rectangle(&points, Box::new(|_, _| true))
}
fn find_biggest_rectangle(points: &[Point], mut filter: Box<dyn FnMut(Point, Point) -> bool>) -> i64 {
    let mut result = 0;
    let mut already_processed_points = HashSet::new();
    for &point_a in points {
        for &point_b in points {
            if point_a == point_b || already_processed_points.contains(&point_b)  {
                continue;
            }
            let area = get_rectangle_area(point_a, point_b);
            if area > result && filter(point_a, point_b) {
                result = area;
            }
        }
        already_processed_points.insert(point_a);
    }

    result
}

// ***********************************************************************************
// Part two
// ***********************************************************************************

// Maps all the x coordinates to all its y coordinates or vice versa
struct PointMap<T> {
    map: HashMap<i32, BTreeSet<i32>>,
    _marker: PhantomData<T>,
}

struct PointX;

struct PointY;

type MapXToY = PointMap<PointX>;

type MapYToX = PointMap<PointY>;

#[derive(Default, Eq, PartialEq, Clone, Copy)]
struct Rect {
    starting_point: Point,
    ending_point: Point,
}

impl Rect {
    fn area(&self) -> i64 {
        get_rectangle_area(self.starting_point, self.ending_point)
    }
}

// Rectangles with equal areas are considered equal, so BTreeSet will keep only one.
impl Ord for Rect {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.area().cmp(&other.area())
    }
}

impl PartialOrd for Rect {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

// Finding if two points are connected to know if they are filled with tiles
struct PathFinder {
    forbidden_area: Rect,
    map_x_to_y: MapXToY,
    map_y_to_x: MapYToX,
}

impl PathFinder {
    fn new(points: &[Point]) -> Self {
        fn get_map_x_to_y(points: &[Point]) -> MapXToY {
            build_point_map(points, |p| (p.x, p.y))
        }

        fn get_map_y_to_x(points: &[Point]) -> MapYToX {
            build_point_map(points, |p| (p.y, p.x))
        }

        fn build_point_map<T, F>(points: &[Point], extractor: F) -> PointMap<T>
        where
            F: Fn(Point) -> (i32, i32),
        {
            let mut result = PointMap {
                map: HashMap::new(),
                _marker: PhantomData,
            };
            for point in points {
                let (key, value) = extractor(*point);
                result
                    .map
                    .entry(key)
                    .or_insert(BTreeSet::new())
                    .insert(value);
            }

            result
        }

        Self {
            forbidden_area: Rect::default(),
            map_x_to_y: get_map_x_to_y(points),
            map_y_to_x: get_map_y_to_x(points),
        }
    }

    fn are_points_reachable(&mut self, starting_point: Point, ending_point: Point) -> bool {
        // Block this area
        //  ●─────────┐ starting_point
        //  │**********************
        //  │**********************
        //  │**********************
        //  │**********************
        //  └─────────● ending_point
        self.forbidden_area = Rect {
            starting_point: Point {
                x: min(starting_point.x, ending_point.x) + 1,
                y: min(starting_point.y, ending_point.y) + 1,
            },
            ending_point: Point {
                x: i32::MAX,
                y: max(starting_point.y, ending_point.y) - 1,
            },
        };
        // Search by passing by the left side:
        let mut explored_points: HashSet<Point> = HashSet::default();
        if !self._search_horizontally(
            starting_point,
            &mut explored_points,
            ending_point,
        ) {
            return false;
        }

        // Block this area
        //        ●─────────┐ starting_point
        //  ****************│
        //  ****************│
        //  ****************│
        //  ****************│
        //        └─────────● ending_point
        self.forbidden_area = Rect {
            starting_point: Point {
                x: 0,
                y: min(starting_point.y, ending_point.y) + 1,
            },
            ending_point: Point {
                x: max(starting_point.x, ending_point.x) - 1,
                y: max(starting_point.y, ending_point.y) - 1,
            },
        };
        // Search by passing by the right side:
        explored_points.clear();
        self._search_horizontally(
            starting_point,
            &mut explored_points,
            ending_point,
        )
    }

    fn _search_horizontally(
        &self,
        point: Point,
        explored_points: &mut HashSet<Point>,
        ending_point: Point,
    ) -> bool {
        if explored_points.contains(&point) {
            return false;
        }

        let x_coordinates = &self.map_y_to_x.map[&point.y];
        // unwrap is safe because we read the coordinates in pairs
        if ending_point.y == point.y
            && !self._in_forbidden_area(point, ending_point)
            && *x_coordinates.first().unwrap() <= ending_point.x
            && ending_point.x <= *x_coordinates.last().unwrap()
        {
            return true;
        }

        for &x in x_coordinates {
            let new_point = Point { x, y: point.y };
            if !self._in_forbidden_area(point, new_point)
                && self._search_vertically(
                new_point,
                explored_points,
                ending_point,
                )
            {
                return true;
            }
        }
        false
    }

    fn _search_vertically(
        &self,
        point: Point,
        explored_points: &mut HashSet<Point>,
        ending_point: Point,
    ) -> bool {
        if explored_points.contains(&point) {
            return false;
        }

        let y_coordinates = &self.map_x_to_y.map[&point.x];
        // unwrap is safe because we read the coordinates in pairs
        if ending_point.x == point.x
            && !self._in_forbidden_area(point, ending_point)
            && *y_coordinates.first().unwrap() <= ending_point.y
            && ending_point.y <= *y_coordinates.last().unwrap()
        {
            return true;
        }
        explored_points.insert(point);

        for &y in y_coordinates {
            let new_point = Point { x: point.x, y };
            if !self._in_forbidden_area(point, new_point)
                && self._search_horizontally(
                new_point,
                explored_points,
                ending_point,
                )
            {
                return true;
            }
        }
        false
    }

    fn _in_forbidden_area(&self, point1: Point, point2: Point) -> bool {
        fn normalize_coordinates(starting_point: &mut Point, ending_point: &mut Point) {
            // Normalize coordinates
            //
            // starting_point  ●─────────┐
            //                 │         │
            //                 │         │
            //                 │         │
            //                 │         │
            //                 │         │
            //                 └─────────● ending_point

            if starting_point.x > ending_point.x {
                (starting_point.x, ending_point.x) = (ending_point.x, starting_point.x)
            }
            if starting_point.y > ending_point.y {
                (starting_point.y, ending_point.y) = (ending_point.y, starting_point.y)
            }
        }

        let forbidden_area = &self.forbidden_area;

        let mut point1 = point1;
        let mut point2 = point2;

        normalize_coordinates(&mut point1, &mut point2);

        fn in_interval(value: i32, a: i32, b: i32) -> bool {
            a <= value && value <= b
        }

        fn outside_interval(value1: i32, value2: i32, a: i32, b: i32) -> bool {
            value1 < a && value2 > b
        }

        for point in [point1, point2] {
            if in_interval(
                point.x,
                forbidden_area.starting_point.x,
                forbidden_area.ending_point.x,
            ) && in_interval(
                point.y,
                forbidden_area.starting_point.y,
                forbidden_area.ending_point.y,
            ) {
                return true; // Point inside
            }
        }
        if point1.y == point2.y {
            // Horizontal
            outside_interval(
                point1.x,
                point2.x,
                forbidden_area.starting_point.x,
                forbidden_area.ending_point.x,
            ) && in_interval(
                point1.y,
                forbidden_area.starting_point.y,
                forbidden_area.ending_point.y,
            )
        } else if point1.x == point2.x {
            // Vertical
            outside_interval(
                point1.y,
                point2.y,
                forbidden_area.starting_point.y,
                forbidden_area.ending_point.y,
            ) && in_interval(
                point1.x,
                forbidden_area.starting_point.x,
                forbidden_area.ending_point.x,
            )
        } else {
            panic!("Line not horizontal nor vertical.");
        }
    }
}

fn find_biggest_rectangle_with_red_and_green_tiles(points: &[Point]) -> i64 {
    let mut path_finder = PathFinder::new(points);
    find_biggest_rectangle(points, Box::new(move |a, b| path_finder.are_points_reachable(a, b)))
}

fn main() {
    let lines = read_lines("input").expect("Failed to open input file");
    let points = parse_points(lines);
    println!("Biggest rectangle: {}", find_biggest_rectangle_default(&points));
    println!(
        "Biggest rectangle with red and green tiles: {}",
        find_biggest_rectangle_with_red_and_green_tiles(&points)
    );
}
