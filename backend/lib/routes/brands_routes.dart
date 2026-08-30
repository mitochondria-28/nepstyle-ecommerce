import 'dart:convert';
import 'package:mysql1/mysql1.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/brand_model.dart';
import '../services/brands_service.dart';

class BrandRoutes {
  final BrandService brandService;
  final MySqlConnection connection;
  BrandRoutes(this.brandService, this.connection);

  Router get router {
    final router = Router();

    // Add a new brand
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final brand = Brand(
          brandName: data['brand_name'],
          brandThumbnail: data['brand_thumbnail'],
          brandDescription: data['brand_description'],
        );

        final addedBrand = await brandService.addBrand(brand);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Brand added successfully',
          'brand': addedBrand.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to add brand: ${e.toString()}',
            }));
      }
    });

    // Retrieve all brands
    router.get('/all', (Request request) async {
      try {
        final brands = await brandService.getAllBrands();

        return Response.ok(jsonEncode({
          'status': true,
          'brands': brands.map((brand) => brand.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch brands: ${e.toString()}',
            }));
      }
    });

    // Retrieve a single brand by ID
    router.get('/<id|[0-9]+>', (Request request, String id) async {
      try {
        final brandId = int.parse(id);
        final brand = await brandService.getBrandById(brandId);

        if (brand == null) {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Brand not found',
              }));
        }

        return Response.ok(jsonEncode({
          'status': true,
          'brand': brand.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch brand: ${e.toString()}',
            }));
      }
    });
    router.delete('/delete/<brandId>', (Request request, String brandId) async {
      try {
        final int id = int.parse(brandId);
        final bool isDeleted = await brandService.deleteBrand(id);

        if (isDeleted) {
          return Response.ok(jsonEncode({
            'status': true,
            'message': 'Brand deleted successfully',
          }));
        } else {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Brand not found',
              }));
        }
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to delete brand: ${e.toString()}',
            }));
      }
    });

// Route for searching brands
    router.get('/search/brands/<query>', (Request request, String query) async {
      try {
        // Perform full-text search on brand name and description
        final results = await connection.query(
            'SELECT * FROM brands WHERE MATCH(brand_name, brand_description) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10',
            [query]);

        final brands = results.map((row) {
          return {
            'brand_id': row['brand_id'],
            'brand_name': row['brand_name'],
            'brand_description': row['brand_description'],
            'brand_thumbnail': row['brand_thumbnail'],
          };
        }).toList();

        return Response.ok(jsonEncode({
          'status': true,
          'brands': brands,
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch brands: ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
