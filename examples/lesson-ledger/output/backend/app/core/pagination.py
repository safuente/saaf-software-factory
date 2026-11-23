"""Pagination of conventions §4: `?page=&page_size=` and the `{items, total, page, page_size}`
envelope. Invalid values answer 422 validation_error through the request validation handler."""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query
from pydantic import BaseModel

MAX_PAGE_SIZE = 500
DEFAULT_PAGE_SIZE = 50


@dataclass(frozen=True)
class PageRequest:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def page_request(
    page: Annotated[int, Query(ge=1, le=2**31 - 1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> PageRequest:
    return PageRequest(page=page, page_size=page_size)


Paging = Annotated[PageRequest, Depends(page_request)]


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
