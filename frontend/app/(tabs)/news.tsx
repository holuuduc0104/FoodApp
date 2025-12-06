import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, ChevronRight, Newspaper, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const API_URL = 'http://192.168.1.109:8000'; // Update with your backend IP

// Mock articles data
const mockArticles = [
  {
    id: '1',
    title: '10 Món Ăn Healthy Cho Mùa Hè',
    description: 'Khám phá những món ăn thanh mát, bổ dưỡng giúp bạn giải nhiệt trong những ngày hè nóng bức.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    category: 'Bài viết',
    date: '05/12/2025',
    readTime: '5 phút',
    featured: true,
  },
  {
    id: '2',
    title: 'Sự Kiện Ẩm Thực Đường Phố 2025',
    description: 'Tham gia sự kiện ẩm thực đường phố lớn nhất năm tại TP.HCM với hơn 100 gian hàng.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    category: 'Sự kiện',
    date: '15/12/2025',
    readTime: '3 phút',
    featured: true,
  },
  {
    id: '3',
    title: 'Bí Quyết Nấu Phở Ngon Chuẩn Vị',
    description: 'Học cách nấu phở bò thơm ngon với công thức gia truyền từ đầu bếp chuyên nghiệp.',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=400&fit=crop',
    category: 'Tin tức',
    date: '03/12/2025',
    readTime: '8 phút',
    featured: false,
  },
  {
    id: '4',
    title: 'Xu Hướng Ẩm Thực 2025',
    description: 'Những xu hướng ẩm thực mới nhất đang được giới trẻ yêu thích trong năm 2025.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    category: 'Tin tức',
    date: '01/12/2025',
    readTime: '6 phút',
    featured: false,
  },
  {
    id: '5',
    title: 'Workshop: Làm Bánh Mì Việt Nam',
    description: 'Đăng ký ngay workshop học làm bánh mì Việt Nam với nguyên liệu tươi ngon.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
    category: 'Sự kiện',
    date: '20/12/2025',
    readTime: '2 phút',
    featured: false,
  },
  {
    id: '6',
    title: 'Dinh Dưỡng Cho Người Tập Gym',
    description: 'Chế độ ăn khoa học giúp tăng cơ, giảm mỡ hiệu quả cho người tập gym.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
    category: 'Bài viết',
    date: '28/11/2025',
    readTime: '7 phút',
    featured: false,
  },
];

type Article = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Bài viết':
      return '#2D6A4F';
    case 'Sự kiện':
      return '#FF6B35';
    case 'Tin tức':
      return '#3B82F6';
    default:
      return '#95A99C';
  }
};

function FeaturedCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: article.image }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
          <Text style={styles.categoryText}>{article.category}</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.featuredDescription} numberOfLines={2}>{article.description}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#FFFFFF" />
            <Text style={styles.featuredMetaText}>{article.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.featuredMetaText}>{article.readTime}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: article.image }} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <View style={[styles.smallCategoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
          <Text style={[styles.smallCategoryText, { color: getCategoryColor(article.category) }]}>
            {article.category}
          </Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.articleDescription} numberOfLines={2}>{article.description}</Text>
        <View style={styles.articleMeta}>
          <View style={styles.metaItem}>
            <Calendar size={11} color="#95A99C" />
            <Text style={styles.articleMetaText}>{article.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={11} color="#95A99C" />
            <Text style={styles.articleMetaText}>{article.readTime}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#95A99C" />
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  const categories = ['Tất cả', 'Bài viết', 'Sự kiện', 'Tin tức'];

  const featuredArticles = articles.filter(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  const filteredArticles = selectedCategory === 'Tất cả' 
    ? regularArticles 
    : regularArticles.filter(a => a.category === selectedCategory);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch from API
    // try {
    //   const response = await fetch(`${API_URL}/api/articles`);
    //   const data = await response.json();
    //   setArticles(data);
    // } catch (error) {
    //   console.error('Error fetching articles:', error);
    // }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleArticlePress = (article: Article) => {
    // TODO: Navigate to article detail
    console.log('Article pressed:', article.id);
    // router.push(`/article/${article.id}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Newspaper size={28} color="#2D6A4F" />
          <Text style={styles.headerTitle}>Tin Tức & Sự Kiện</Text>
        </View>
        <Text style={styles.headerSubtitle}>Cập nhật thông tin ẩm thực mới nhất</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D6A4F']} />
        }
      >
        {/* Featured Section */}
        {selectedCategory === 'Tất cả' && featuredArticles.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Star size={18} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Nổi bật</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredArticles.map((article) => (
                <FeaturedCard 
                  key={article.id} 
                  article={article} 
                  onPress={() => handleArticlePress(article)} 
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Regular Articles */}
        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'Tất cả' ? 'Tất cả bài viết' : selectedCategory}
          </Text>
          {filteredArticles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onPress={() => handleArticlePress(article)} 
            />
          ))}
          {filteredArticles.length === 0 && (
            <View style={styles.emptyState}>
              <Newspaper size={48} color="#95A99C" />
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF9',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B4332',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#95A99C',
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FBF9',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2D6A4F',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#95A99C',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  featuredSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B4332',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredScroll: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: width - 64,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  articlesSection: {
    marginTop: 20,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  articleContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  smallCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  smallCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 4,
    lineHeight: 18,
  },
  articleDescription: {
    fontSize: 12,
    color: '#95A99C',
    lineHeight: 16,
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  articleMetaText: {
    fontSize: 10,
    color: '#95A99C',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A99C',
    marginTop: 12,
  },
});
