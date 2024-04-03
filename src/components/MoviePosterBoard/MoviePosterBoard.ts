import "./style.css";

import MoviePoster, { MovieInfo } from "../MoviePoster/MoviePoster";

import { $, $$ } from "../../utils/selector";
import createElement from "../../utils/createElement";
import NetworkFallback from "../NetworkErrorFallBack/NetworkErrorFallback";
import SkeletonMoviePoster from "../MoviePoster/SkeletonMoviePoster";
import SeeMoreButton from "../Button/SeeMoreButton";
import MovieDetailModal from "../Modal/MovieDetailModal";

export type MoviePosterType = "popular" | "search";
const numberOfPosters = 20;

class MoviePosterBoard {
  public element;
  private moviePosterUl: HTMLElement;
  private seeMoreButton;

  constructor(posterType: MoviePosterType, movieName: string = "") {
    const description = this.createDescription(posterType, movieName);
    this.element = this.createSectionElement(description);
    this.moviePosterUl = createElement({
      tagName: "ul",
      attrs: { class: "item-list" },
    });

    this.moviePosterUl.addEventListener("click", this.openMovieDetailModal);

    this.seeMoreButton = new SeeMoreButton();
    this.element.append(this.moviePosterUl);
    this.handleSeeMoreButton(posterType, movieName);
  }

  private addMoviePoster(movieInfos: MovieInfo[]) {
    const newMoviePosters = movieInfos.map(
      (movieInfo) => new MoviePoster(movieInfo).element
    );

    this.moviePosterUl.append(...newMoviePosters);
  }

  private notFoundMovie(movieName: string) {
    this.element
      .querySelector("h2")
      ?.replaceChildren(movieName + " 그런 건 없어용!~ 🌞");
  }

  private createSectionElement(description: string) {
    const section = createElement({
      tagName: "section",
      attrs: { class: "item-view" },
    });
    const h2 = createElement({ tagName: "h2", contents: description });
    section.append(h2);

    return section;
  }

  private addSkeletonPosters(count: number) {
    this.moviePosterUl.append(...this.createSkeletons(count));
  }

  private deleteLastPosters(count: number) {
    Array.from({ length: count }).forEach(() =>
      this.moviePosterUl.lastChild?.remove()
    );
  }

  private createSkeletons(count: number) {
    return Array.from({ length: count }).map(
      () => new SkeletonMoviePoster().element
    );
  }

  private showNetworkFallbackComponent(
    posterType: MoviePosterType,
    movieName?: string
  ) {
    const networkErrorFallback = new NetworkFallback(posterType, movieName)
      .element;
    $("body>section")?.remove();
    $("body")?.append(networkErrorFallback);
  }

  private fetchErrorHandler(posterType: MoviePosterType, movieName: string) {
    return this.showNetworkFallbackComponent(posterType, movieName);
  }

  private createDescription(posterType: MoviePosterType, name: string) {
    if (posterType === "search" && name) return `"${name}" 검색 결과`;
    return "지금 인기있는 영화";
  }

  private observeLastItem(observer: IntersectionObserver) {
    if (this.seeMoreButton.isLastPage()) return;

    setTimeout(() => {
      const items = $$(".item-list li");
      const lastItem = items[items.length - 1];

      if (lastItem) observer.observe(lastItem);
    }, 1000);
  }

  private setInfiniteScroll(posterType: MoviePosterType, movieName: string) {
    const observer = new IntersectionObserver((entries, observer) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        this.handleSeeMoreButton(posterType, movieName, observer);
        observer.unobserve(entry.target);
      }
    });

    this.observeLastItem(observer);
  }

  private async handleSeeMoreButton(
    posterType: MoviePosterType,
    movieName: string,
    observer?: IntersectionObserver
  ) {
    this.addSkeletonPosters(numberOfPosters);
    const fetchedMovieInfo = await this.seeMoreButton.getMoreMoviePoster(
      posterType,
      movieName
    );
    this.deleteLastPosters(numberOfPosters);
    if (!fetchedMovieInfo) return this.fetchErrorHandler(posterType, movieName);

    if (fetchedMovieInfo.length) this.addMoviePoster(fetchedMovieInfo);
    else this.notFoundMovie(movieName);

    if (observer) this.observeLastItem(observer);
    else this.setInfiniteScroll(posterType, movieName);
  }

  private async openMovieDetailModal(event: Event) {
    const clickedElement = event.target as HTMLElement;
    const closestDiv = clickedElement.closest("div.item-card") as HTMLElement;
    const { movieId } = closestDiv?.dataset;
    if (!movieId) return;

    const movieDetailModal = new MovieDetailModal(movieId);
    $("body")?.append(movieDetailModal.element);
  }
}

export default MoviePosterBoard;
