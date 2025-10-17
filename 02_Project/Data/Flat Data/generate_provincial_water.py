import csv
import random

provinces = [
    'Gauteng',
    'KwaZulu-Natal',
    'Western Cape',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Free State',
    'Northern Cape'
]

base_water_sources = [
    {'ID': 1, 'Water Source': 'improved water source', 'percentage': 86.3},
    {'ID': 2, 'Water Source': 'water piped into dwelling', 'percentage': 38.9},
    {'ID': 3, 'Water Source': 'public tap/standpipe', 'percentage': 19.5},
    {'ID': 4, 'Water Source': 'tubewell/borehole', 'percentage': 3.0},
    {'ID': 5, 'Water Source': 'rainwater', 'percentage': 0.7},
    {'ID': 6, 'Water Source': 'tanker truck', 'percentage': 1.0},
    {'ID': 7, 'Water Source': 'bottled water', 'percentage': 0.1},
    {'ID': 8, 'Water Source': 'unimproved water source', 'percentage': 13.2},
    {'ID': 9, 'Water Source': 'surface water', 'percentage': 11.8},
    {'ID': 10, 'Water Source': 'other water source', 'percentage': 1.4},
    {'ID': 11, 'Water Source': "don't know or missing information on water source", 'percentage': 0.5}
]


def generate_provincial_variations(province_index):
    random.seed(province_index + 42)

    variations = []
    for source in base_water_sources:
        base_pct = source['percentage']

        if base_pct > 10:
            variation = random.uniform(-2.5, 2.5)
        elif base_pct > 5:
            variation = random.uniform(-1.5, 1.5)
        elif base_pct > 1:
            variation = random.uniform(-0.8, 0.8)
        else:
            variation = random.uniform(-0.3, 0.3)

        new_pct = max(0.1, base_pct + variation)
        variations.append(new_pct)

    total = sum(variations)
    normalized = [(v / total) * 100 for v in variations]

    return normalized


output_data = []
row_id = 1

for idx, province in enumerate(provinces):
    percentages = generate_provincial_variations(idx)

    for i, source in enumerate(base_water_sources):
        output_data.append({
            'ID': row_id,
            'Province': province,
            'Water Source': source['Water Source'],
            'percentage': round(percentages[i], 1)
        })
        row_id += 1

with open('Water_Provincial.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['ID', 'Province', 'Water Source', 'percentage'])
    writer.writeheader()
    writer.writerows(output_data)

print(f'Generated {len(output_data)} records across {len(provinces)} provinces')

for province in provinces:
    province_data = [row for row in output_data if row['Province'] == province]
    total = sum(row['percentage'] for row in province_data)
    print(f'{province}: {total:.1f}% (should be 100%)')
