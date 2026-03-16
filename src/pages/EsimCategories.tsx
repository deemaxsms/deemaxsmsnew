/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EsimCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const esimProducts = await firestoreService.getProductListings('esim');
        const allProducts = esimProducts || [];

        // Group by subcategory
        const categoryMap = new Map();
        allProducts.forEach((product: any) => {
          const subcat = product.subcategory || 'general';
          if (!categoryMap.has(subcat)) {
            categoryMap.set(subcat, {
              name: subcat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              subcategory: subcat,
              image: product.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
              productsCount: 0
            });
          }
          categoryMap.get(subcat).productsCount += 1;
        });

        const uniqueCategories = Array.from(categoryMap.values());
        if (mounted) setCategories(uniqueCategories);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Header />
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">eSIM Categories</h1>
          <p className="text-xl text-muted-foreground">
            Choose from our wide range of eSIM data plans for global connectivity
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.subcategory} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <Badge variant="secondary" className="mb-2">
                    {category.productsCount} plans available
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Explore {category.name.toLowerCase()} eSIM plans
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/esim-category/${category.subcategory}`}>
                      View Plans
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default EsimCategories;