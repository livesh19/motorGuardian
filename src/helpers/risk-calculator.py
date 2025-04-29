import json

def calculate_risk_per_segment(accident_data, segment_coordinates, segment_name):
    """
    Calculates the risk score for a road segment based on nearby accident data.

    Args:
        accident_data: A list of dictionaries, where each dictionary represents an accident
                       with 'latitude', 'longitude', and 'count'.
        segment_coordinates: A list of tuples, where each tuple represents (latitude, longitude)
                             of a point defining the road segment.
        segment_name: the name of the segment.

    Returns:
        A float representing the risk score for the segment.
    """
    try:
        segment_risk = 0
        segment_length = calculate_segment_length(segment_coordinates)
        
        if segment_length <= 0:
          print(f"Warning: segment {segment_name} length is zero or negative")
          return 0

        nearby_accidents = []
        for accident in accident_data:
            if is_point_near_segment((accident['latitude'], accident['longitude']), segment_coordinates):
                nearby_accidents.append(accident)

        for accident in nearby_accidents:
            segment_risk += accident['count']
        
        if segment_length <= 0:
            print(f"Warning: segment {segment_name} length is zero or negative")
            return 0
        risk_per_km = segment_risk / segment_length
        return risk_per_km
    except Exception as e:
        print(f"Error calculating risk for segment: {e}")
        return 0


def calculate_segment_length(segment_coordinates):
    """
    Calculates the approximate length of a road segment (in km).

    Args:
        segment_coordinates: A list of (latitude, longitude) tuples.

    Returns:
        The approximate length of the segment in kilometers.
    """
    try:
        total_length = 0
        for i in range(len(segment_coordinates) - 1):
            total_length += haversine_distance(segment_coordinates[i], segment_coordinates[i + 1])
        return total_length
    except Exception as e:
        print(f"Error calculating segment length: {e}")
        return 0


def haversine_distance(coord1, coord2):
    """
    Calculates the great-circle distance between two points on the Earth
    using the Haversine formula.

    Args:
        coord1: A tuple (latitude, longitude) of the first point.
        coord2: A tuple (latitude, longitude) of the second point.

    Returns:
        The distance between the two points in kilometers.
    """
    import math

    try:
        R = 6371.0  # Radius of the Earth in kilometers

        lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
        lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])

        dlon = lon2 - lon1
        dlat = lat2 - lat1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c
        return distance
    except Exception as e:
        print(f"Error calculating haversine distance: {e}")
        return 0

def is_point_near_segment(point, segment_coordinates, threshold_km=0.5):
    """
    Checks if a point is near a road segment within a certain threshold.

    Args:
        point: A tuple (latitude, longitude) of the point to check.
        segment_coordinates: A list of (latitude, longitude) tuples.
        threshold_km: The threshold distance in kilometers.

    Returns:
        True if the point is near the segment, False otherwise.
    """
    try:
      for i in range(len(segment_coordinates) - 1):
          if is_point_near_line(point, segment_coordinates[i], segment_coordinates[i + 1], threshold_km):
              return True
      return False
    except Exception as e:
      print(f"Error checking if point is near segment: {e}")
      return False

def is_point_near_line(point, line_start, line_end, threshold_km):
    """
    Checks if a point is near a line segment within a certain threshold.
    """
    try:
      distance_to_start = haversine_distance(point, line_start)
      distance_to_end = haversine_distance(point, line_end)
      segment_length = haversine_distance(line_start, line_end)
      
      if segment_length <= 0:
        return distance_to_start <= threshold_km or distance_to_end <= threshold_km

      if distance_to_start <= threshold_km or distance_to_end <= threshold_km:
          return True

      # Calculate the distance from the point to the line using the perpendicular formula
      if segment_length > 0:
        s = ((line_end[1]-line_start[1])*(point[0]-line_start[0])-(line_end[0]-line_start[0])*(point[1]-line_start[1]))/segment_length**2
        if s >= 0 and s <= 1:
          d = abs(((line_end[1]-line_start[1])*(point[0]-line_start[0])-(line_end[0]-line_start[0])*(point[1]-line_start[1]))/segment_length)
          return d <= threshold_km
      return False
    except Exception as e:
      print(f"Error checking if point is near line: {e}")
      return False
    
# Example usage:
def main():
  try:
      with open('src/data/chennai-accidents.json', 'r') as f:
          accident_data = json.load(f)
  except FileNotFoundError:
      print("Error: chennai-accidents.json not found.")
      return
  except json.JSONDecodeError:
      print("Error: Invalid JSON format in chennai-accidents.json.")
      return

  # Example road segment (replace with real data)
  segment1_coordinates = [(13.0827, 80.2707), (13.0604, 80.2478), (13.0479, 80.2139)]
  segment1_name = "segment1"
  segment2_coordinates = [(13.0479, 80.2139), (13.0080, 80.2800)]
  segment2_name = "segment2"

  risk1 = calculate_risk_per_segment(accident_data, segment1_coordinates, segment1_name)
  risk2 = calculate_risk_per_segment(accident_data, segment2_coordinates, segment2_name)
  print(f"Risk score for segment {segment1_name}: {risk1:.2f} accidents/km")
  print(f"Risk score for segment {segment2_name}: {risk2:.2f} accidents/km")
  # You can save this data to a JSON file for later use in your React app

if __name__ == "__main__":
    main()