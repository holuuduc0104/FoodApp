import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  ScrollView,
  Image, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, ChevronRight, Newspaper, Star, ExternalLink } from 'lucide-react-native';
import { fetchArticles, Article } from '../../services/api';

const { width } = Dimensions.get('window');

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'article':
    case 'bài viết':
      return '#2D6A4F';
    case 'event':
    case 'sự kiện':
      return '#FF6B35';
    case 'news':
    case 'tin tức':
      return '#3B82F6';
    default:
      return '#95A99C';
  }
};

const getCategoryName = (category: string) => {
  switch (category.toLowerCase()) {
    case 'article':
      return 'Articles';
    case 'event':
      return 'Events';
    case 'news':
      return 'News';
    default:
      return category;
  }
};

function FeaturedCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: article.image_url || article.image_url }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
          <Text style={styles.categoryText}>{getCategoryName(article.category)}</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.featuredDescription} numberOfLines={2}>{article.description}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#FFFFFF" />
            <Text style={styles.featuredMetaText}>{article.date}</Text>
          </View>
          {article.read_time && (
            <View style={styles.metaItem}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.featuredMetaText}>{article.read_time}</Text>
            </View>
          )}
          {article.source && (
            <View style={styles.metaItem}>
              <Text style={styles.featuredMetaText}>• {article.source}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: article.image_url || article.image_url }} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <View style={[styles.smallCategoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
          <Text style={[styles.smallCategoryText, { color: getCategoryColor(article.category) }]}>
            {getCategoryName(article.category)}
          </Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.articleDescription} numberOfLines={2}>{article.description}</Text>
        <View style={styles.articleMeta}>
          <View style={styles.metaItem}>
            <Calendar size={11} color="#95A99C" />
            <Text style={styles.articleMetaText}>{article.date}</Text>
          </View>
          {article.read_time && (
            <View style={styles.metaItem}>
              <Clock size={11} color="#95A99C" />
              <Text style={styles.articleMetaText}>{article.read_time}</Text>
            </View>
          )}
          {article.source && (
            <View style={styles.metaItem}>
              <Text style={styles.articleMetaText}>• {article.source}</Text>
            </View>
          )}
        </View>
      </View>
      {article.url ? <ExternalLink size={18} color="#95A99C" /> : <ChevronRight size={20} color="#95A99C" />}
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);

  const PAGE_SIZE = 50;  // Load 50 food articles

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'news', label: 'News' },
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Try NewsAPI first
      try {
        const response = await fetchArticles('newsapi', undefined, undefined, page, PAGE_SIZE);
        if (response && response.articles.length > 0) {
          if (append) {
            setArticles(prev => [...prev, ...response.articles]);
          } else {
            setArticles(response.articles);
          }
          setHasMore(response.has_more);
          setTotalArticles(response.total);
          setCurrentPage(page);
          return;
        }
      } catch (newsApiError) {
        console.log('NewsAPI failed, trying Supabase fallback...');
      }
      
      // Fallback to Supabase if NewsAPI fails
      const fallbackResponse = await fetchArticles('supabase', undefined, undefined, page, PAGE_SIZE);
      if (append) {
        setArticles(prev => [...prev, ...fallbackResponse.articles]);
      } else {
        setArticles(fallbackResponse.articles);
      }
      setHasMore(fallbackResponse.has_more);
      setTotalArticles(fallbackResponse.total);
      setCurrentPage(page);
      
      if (!append && fallbackResponse.articles.length === 0) {
        Alert.alert('Notice', 'No news available. Please try again later.');
      }
    } catch (error: any) {
      console.error('Error loading articles:', error);
      if (!append) {
        Alert.alert(
          'Error',
          'Unable to load news. Check network connection and backend server.',
          [{ text: 'Retry', onPress: () => loadArticles() }, { text: 'Close' }]
        );
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreArticles = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadArticles(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, loading, currentPage]);

  const featuredArticles = articles.filter(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  const filteredArticles = selectedCategory === 'all' 
    ? regularArticles 
    : regularArticles.filter(a => a.category === selectedCategory);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadArticles(1, false);
    setRefreshing(false);
  };

  const handleArticlePress = async (article: Article) => {
    // Navigate to article detail page with article data
    router.push({
      pathname: `/article/[id]`,
      params: {
        id: article.id,
        article: JSON.stringify(article),
      },
    } as any);
  };

  const renderFooter = () => {
    if (articles.length === 0) return null;
    
    return (
      <View style={styles.footerContainer}>
        {loadingMore ? (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color="#2D6A4F" />
            <Text style={styles.loadMoreText}>Loading more...</Text>
          </View>
        ) : hasMore ? (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreArticles}>
            <Text style={styles.loadMoreButtonText}>Load more articles</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.endText}>Showing all {articles.length} articles</Text>
        )}
        
        {/* Pagination info */}
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {currentPage} • {articles.length}/{totalArticles} articles
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Featured Section */}
      {selectedCategory === 'all' && featuredArticles.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Star size={18} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Featured</Text>
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

      {/* Section Title */}
      <View style={styles.articlesSection}>
        <View style={styles.articlesSectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.key === selectedCategory)?.label}
          </Text>
          {totalArticles > 0 && (
            <Text style={styles.totalCount}>({totalArticles} articles)</Text>
          )}
        </View>
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Newspaper size={48} color="#95A99C" />
      <Text style={styles.emptyText}>No articles yet</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Newspaper size={28} color="#2D6A4F" />
          <Text style={styles.headerTitle}>News & Events</Text>
        </View>
        <Text style={styles.headerSubtitle}>Latest food information updates</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => {
                setSelectedCategory(category.key);
              }}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.categoryButtonTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArticleCard 
              article={item} 
              onPress={() => handleArticlePress(item)} 
            />
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          onEndReached={loadMoreArticles}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D6A4F']} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      )}
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
  flatListContent: {
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  articlesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalCount: {
    fontSize: 14,
    color: '#95A99C',
    fontWeight: '400',
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#95A99C',
    marginTop: 12,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#2D6A4F',
  },
  footerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  endText: {
    fontSize: 14,
    color: '#95A99C',
    fontStyle: 'italic',
  },
  paginationInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  paginationText: {
    fontSize: 13,
    color: '#95A99C',
  },
});
